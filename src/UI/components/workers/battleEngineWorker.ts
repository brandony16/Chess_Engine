import { getEngineByName } from "../../../engines/bondmonkeyVersions/engineList.ts";
import type { Bondmonkey } from "../../../engines/bondmonkeyVersions/type.ts";
import { SearchContext } from "../../../engines/searchContext.ts";
import {
  getRandomOpening,
  playOpeningMoves,
} from "../../../engines/testing/openings.ts";
import { DRAW, WHITE_WIN, type Result } from "../../../game/chessConstants.ts";
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
};

self.onmessage = async (e) => {
  const { engine1Name, eng1Depth, engine2Name, eng2Depth, games } = e.data;

  const engine1 = getEngineByName(engine1Name, eng1Depth);
  const engine2 = getEngineByName(engine2Name, eng2Depth);

  // cap node limit at 100K so matches arent stupidly long
  const result = await runMatch(engine1, engine2, games, 100_000);

  // Final stats
  const winRate = ((result.wins / games) * 100).toFixed(1);
  self.postMessage({ type: "done", ...result, winRate });
};

type MatchResult = {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  score: number;
};

const runMatch = async (
  engine1: Bondmonkey,
  engine2: Bondmonkey,
  numGames: number,
  nodeLimit: number,
  seed: number = 1,
): Promise<MatchResult> => {
  try {
    const openingRes = await fetch("/openings.json");
    const openings = await openingRes.json();

    const res: MatchResult = {
      games: numGames,
      wins: 0,
      losses: 0,
      draws: 0,
      score: 0,
    };

    const rng = mulberry32(seed);

    const recordResult = (
      result: Result,
      white: Bondmonkey,
      black: Bondmonkey,
    ) => {
      if (result === DRAW) {
        res.draws++;
        return;
      }

      const winner = result === WHITE_WIN ? white : black;
      if (winner === engine1) {
        res.wins++;
      } else {
        res.losses++;
      }
    };

    for (let i = 0; i < numGames; i += 2) {
      if (i % 10 === 0) {
        console.log(`Game ${i} started`);
      }

      const gameSeed = Math.floor(rng() * 1e9);
      const openingMoves = await getRandomOpening(openings, gameSeed);

      // Each engine plays the same opening with white and black
      const result1 = await playSingleGame(
        engine1,
        engine2,
        openingMoves,
        nodeLimit,
      );
      const result2 = await playSingleGame(
        engine2,
        engine1,
        openingMoves,
        nodeLimit,
      );

      recordResult(result1, engine1, engine2);
      recordResult(result2, engine2, engine1);
    }

    const score = res.wins + 0.5 * res.draws;
    res.score = score;

    return res;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

async function playSingleGame(
  white: Bondmonkey,
  black: Bondmonkey,
  openingMoves: string[],
  maxNodeCt: number,
): Promise<Result> {
  const pos = new Position();
  const MAX_PLY = 512;

  white.newGame();
  black.newGame();

  await playOpeningMoves(openingMoves, pos);

  const ctx = new SearchContext(maxNodeCt);
  while (!pos.gameOver() && pos.fullmoveNumber * 2 < MAX_PLY) {
    ctx.reset(maxNodeCt);
    const whiteMove = white.search(pos, ctx);
    pos.makeMove(whiteMove);

    pos.checkGameOver();
    if (pos.gameOver()) break;
    ctx.reset(maxNodeCt);

    const blackMove = black.search(pos, ctx);
    pos.makeMove(blackMove);

    pos.checkGameOver();
  }

  if (pos.fullmoveNumber * 2 >= MAX_PLY) {
    return DRAW;
  }

  return pos.result;
}
