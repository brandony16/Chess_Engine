import { parentPort } from "worker_threads";
import { Position } from "../../game/Position.ts";
import {
  ContextType,
  SearchContext,
  type ClockType,
} from "../searchContext.ts";
import { playOpeningMoves } from "./openings.ts";
import {
  BLACK_WIN,
  DRAW,
  IN_PROGRESS,
  WHITE_WIN,
  type Result,
} from "../../game/chessConstants.ts";
import {
  getEngineByName,
  type EngineName,
} from "../bondmonkeyVersions/engineList.ts";
import type { Bondmonkey } from "../bondmonkeyVersions/type.ts";
import { MinimaxV8 } from "../minimaxEngines/v8.ts";
import { evaluateV4 } from "../evaluation/evaluationv4.ts";
import { buildPGNFromEngineGame } from "../../game/fenAndUCI/pgn.ts";

function warmupJIT() {
  const warmupPos = new Position();
  const warmupV8 = new MinimaxV8(32);
  const ctx = new SearchContext({
    type: ContextType.FIXED_TIME,
    maxTimeMs: 100,
  }); // 100ms per move

  // Play 10 moves to force V8 to compile the negamax function
  for (let i = 0; i < 10; i++) {
    const move = warmupV8.search(warmupPos, evaluateV4, ctx);
    warmupPos.makeMove(move);
  }
}

warmupJIT();

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

export type EngineConfig = {
  version: EngineName;
  depth: number;
};

export type MatchMessage = {
  e1Config: EngineConfig;
  e2Config: EngineConfig;
  openingMoves: string[];
  clockSettings: ClockType;
};

export type MatchResponse = {
  res1: Result;
  res2: Result;
  pgn1: string;
  pgn2: string;
  e1AvgDepth: number;
  e2AvgDepth: number;
};

parentPort?.on("message", async (task: MatchMessage) => {
  const { e1Config, e2Config, openingMoves, clockSettings } = task;

  // --- GAME 1: Engine 1 is White ---
  const g1_White = getEngineByName(e1Config.version, e1Config.depth);
  const g1_Black = getEngineByName(e2Config.version, e2Config.depth);
  const gameRes1 = await playSingleGame(
    g1_White,
    g1_Black,
    openingMoves,
    clockSettings,
  );

  // --- GAME 2: Engine 1 is Black ---
  const g2_White = getEngineByName(e2Config.version, e2Config.depth);
  const g2_Black = getEngineByName(e1Config.version, e1Config.depth);
  const gameRes2 = await playSingleGame(
    g2_White,
    g2_Black,
    openingMoves,
    clockSettings,
  );

  const e1AvgDepth = (gameRes1.wAvgDepth + gameRes2.bAvgDepth) / 2;
  const e2AvgDepth = (gameRes1.bAvgDepth + gameRes2.wAvgDepth) / 2;

  const res: MatchResponse = {
    res1: gameRes1.result,
    res2: gameRes2.result,
    pgn1: gameRes1.pgn,
    pgn2: gameRes2.pgn,
    e1AvgDepth,
    e2AvgDepth,
  };

  // Send results back
  parentPort?.postMessage(res);
});
