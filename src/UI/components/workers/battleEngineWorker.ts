import { getEngineByName } from "../../../engines/bondmonkeyVersions/engineList.ts";
import type { Bondmonkey } from "../../../engines/bondmonkeyVersions/type.ts";
import { MAX_SEARCH_PLY } from "../../../engines/Engine.ts";
import {
  SearchContext,
  type ClockType,
} from "../../../engines/searchContext.ts";
import type {
  EngineConfig,
  MatchMessage,
  MatchResponse,
} from "../../../engines/testing/matchWorker.ts";
import {
  getRandomOpening,
  playOpeningMoves,
} from "../../../engines/testing/openings.ts";
import {
  BLACK_WIN,
  DRAW,
  IN_PROGRESS,
  WHITE_WIN,
  type Result,
} from "../../../game/chessConstants.ts";
import { buildPGNFromEngineGame } from "../../../game/fenAndUCI/pgn.ts";
import { Position } from "../../../game/Position.ts";
import { mulberry32 } from "../../../random.ts";

export type BattleWorkerResponse = {
  type: "finished" | "done" | "progress";
  wins: number;
  draws: number;
  losses: number;
  games: number;
  score: number;
  winRate: number;
  pgnData?: string; // Added so we can send the PGN back to the UI
};

export type BattleWorkerMessage = {
  engine1Config: EngineConfig;
  engine2Config: EngineConfig;
  clockSettings: ClockType;
  games: number;
};

self.onmessage = async (e: MessageEvent) => {
  const {
    engine1Config,
    engine2Config,
    clockSettings,
    games,
  }: BattleWorkerMessage = e.data;

  const result = await runMatch(
    engine1Config,
    engine2Config,
    games,
    clockSettings,
  );

  // Final stats
  const winRate = ((result.wins / games) * 100).toFixed(1);
  self.postMessage({
    type: "done",
    ...result,
    winRate: Number(winRate),
  });
};

type MatchResult = {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  score: number;
  pgnData?: string;
};

const runMatch = async (
  e1Config: EngineConfig,
  e2Config: EngineConfig,
  numGames: number,
  clockSettings: ClockType,
  seed: number = 1,
): Promise<MatchResult> => {
  // Fetch openings
  const openingRes = await fetch("/openings.json");
  const openings = await openingRes.json();
  const rng = mulberry32(seed);

  const res: MatchResult = {
    games: numGames,
    wins: 0,
    losses: 0,
    draws: 0,
    score: 0,
  };

  const pgns: string[] = [];
  const targetPairs = Math.ceil(numGames / 2);

  const engine1 = getEngineByName(e1Config.version, e1Config.depth);
  const engine2 = getEngineByName(e2Config.version, e2Config.depth);

  const recordResult = (result: Result, isE1White: boolean) => {
    if (result === DRAW) {
      res.draws++;
      return;
    }
    const isE1Win =
      (result === WHITE_WIN && isE1White) ||
      (result === BLACK_WIN && !isE1White);

    if (isE1Win) res.wins++;
    else res.losses++;
  };

  for (let i = 0; i < targetPairs; i++) {
    const gameSeed = Math.floor(rng() * 1e9);
    const openingMoves = await getRandomOpening(openings, gameSeed);

    // --- GAME 1: Engine 1 is White ---
    const game1 = await playSingleGame(
      engine1,
      engine2,
      openingMoves,
      clockSettings,
    );
    recordResult(game1.result, true);
    pgns.push(game1.pgn);

    // --- GAME 2: Engine 1 is Black ---
    const game2 = await playSingleGame(
      engine2,
      engine1,
      openingMoves,
      clockSettings,
    );
    recordResult(game2.result, false);
    pgns.push(game2.pgn);

    res.score = res.wins + 0.5 * res.draws;

    // 3. Send progress back to the UI after every pair
    self.postMessage({
      type: "progress",
      wins: res.wins,
      draws: res.draws,
      losses: res.losses,
      games: numGames,
      score: res.score,
      winRate: Number(((res.wins / ((i + 1) * 2)) * 100).toFixed(1)),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  res.pgnData = pgns.join("\n\n");
  return res;
};

async function playSingleGame(
  white: Bondmonkey,
  black: Bondmonkey,
  openingMoves: string[],
  clockType: ClockType,
) {
  const pos = new Position();
  const MAX_PLY = 512;

  white.newGame();
  black.newGame();

  await playOpeningMoves(openingMoves, pos);

  const wCtx = new SearchContext(clockType);
  const bCtx = new SearchContext(clockType);

  const moveList = [];

  let whiteDepthReachedTotal = 0;
  let blackDepthReachedTotal = 0;
  let numWhiteMoves = 0;
  let numBlackMoves = 0;

  let result: Result = IN_PROGRESS;

  // ADJUDICATION
  // We can stop games early and award WDL if positions are dominant or stagnant
  // This saves computation with one side stalling out the game or both engines
  // trying to avoid repetition until the 50 move rule takes effect
  let whiteWinStreak = 0;
  let blackWinStreak = 0;
  let drawStreak = 0;

  const WIN_THRESHOLD = 800; // 8 pawns
  const DRAW_THRESHOLD = 15; // 0.15 pawns
  const STREAK_REQUIRED = 5; // 5 full moves (both sides agree/maintain)

  while (!pos.gameOver() && pos.fullmoveNumber * 2 < MAX_PLY) {
    const whiteMove = white.search(pos, wCtx);
    if (wCtx.lostOnTime()) {
      result = BLACK_WIN;
      break;
    }

    const wEval = white.getEval(pos);
    moveList.push(whiteMove);

    whiteDepthReachedTotal += white.depthOfPrevSearch;
    numWhiteMoves++;

    pos.makeMove(whiteMove);
    pos.checkGameOver();

    if (pos.gameOver()) break;

    const blackMove = black.search(pos, bCtx);
    if (bCtx.lostOnTime()) {
      result = WHITE_WIN;
      break;
    }

    const bEval = black.getEval(pos);
    moveList.push(blackMove);

    blackDepthReachedTotal += black.depthOfPrevSearch;
    numBlackMoves++;

    pos.makeMove(blackMove);
    pos.checkGameOver();

    // --- ADJUDICATION LOGIC ---
    // Check for White Win Streak
    // Both engines must agree White is crushing (wEval is high positive, bEval is high negative)
    if (wEval >= WIN_THRESHOLD && bEval <= -WIN_THRESHOLD) {
      whiteWinStreak++;
      blackWinStreak = 0;
      drawStreak = 0;
    }

    // Check for Black Win Streak
    else if (bEval >= WIN_THRESHOLD && wEval <= -WIN_THRESHOLD) {
      blackWinStreak++;
      whiteWinStreak = 0;
      drawStreak = 0;
    }

    // Check for Draw Streak
    else if (
      Math.abs(wEval) <= DRAW_THRESHOLD &&
      Math.abs(bEval) <= DRAW_THRESHOLD
    ) {
      drawStreak++;
      whiteWinStreak = 0;
      blackWinStreak = 0;
    }

    // Break the streaks if the advantage slips
    else {
      whiteWinStreak = 0;
      blackWinStreak = 0;
      drawStreak = 0;
    }

    // --- EXECUTE ADJUDICATION ---

    if (whiteWinStreak >= STREAK_REQUIRED) {
      result = WHITE_WIN;
      break;
    } else if (blackWinStreak >= STREAK_REQUIRED) {
      result = BLACK_WIN;
      break;
    } else if (drawStreak >= STREAK_REQUIRED * 2) {
      // Require 10 moves for a draw to be safe
      result = DRAW;
      break;
    }
  }

  // If already set, then they lost on time

  if (result === IN_PROGRESS) {
    result = pos.fullmoveNumber * 2 >= MAX_PLY ? DRAW : pos.result;
  }

  const pgn = buildPGNFromEngineGame(openingMoves, moveList, {
    white: white.name,
    black: black.name,
    result,
  });

  const wAvgDepth = whiteDepthReachedTotal / numWhiteMoves;
  const bAvgDepth = blackDepthReachedTotal / numBlackMoves;

  return { result, pgn, wAvgDepth, bAvgDepth };
}
