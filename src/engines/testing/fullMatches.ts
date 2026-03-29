import { DRAW, WHITE_WIN, type Result } from "../../game/chessConstants.ts";
import { Position } from "../../game/Position.ts";
import type { Engine } from "../Engine.ts";
import {
  fetchOpenings,
  getRandomOpening,
  playOpeningMoves,
} from "./openings.ts";
import { mulberry32 } from "../../random.ts";
import { SearchContext } from "../searchContext.ts";

type MatchResult = {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  score: number;
};
export const runMatch = async (
  engine1: Engine,
  engine2: Engine,
  numGames: number,
  nodeLimit: number,
  seed: number = 1,
) => {
  const openings = await fetchOpenings();
  const res: MatchResult = {
    games: numGames,
    wins: 0,
    losses: 0,
    draws: 0,
    score: 0,
  };

  const rng = mulberry32(seed);

  const recordResult = (result: Result, white: Engine, black: Engine) => {
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
};

async function playSingleGame(
  white: Engine,
  black: Engine,
  openingMoves: string[],
  maxNodeCt: number,
): Promise<Result> {
  const pos = new Position();
  const MAX_PLY = 512;

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
