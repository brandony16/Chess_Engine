import { DRAW, WHITE_WIN, type Result } from "../../game/chessConstants.ts";
import { uciToMove } from "../../game/fenAndUCI/uciHelpers.ts";
import type Move from "../../game/moveMaking/move.ts";
import { Position } from "../../game/Position.ts";
import { fetchOpenings, getRandomOpening, playOpeningMoves } from "./openings.ts";
import { mulberry32 } from "./random.ts";

export type Engine = {
  name: string;
  search(pos: Position, maxTimeMs: number): Move;
};

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
  timeLimitMs: number = 1000,
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
    const gameSeed = Math.floor(rng() * 1e9);
    const openingMoves = await getRandomOpening(openings, gameSeed);

    // Each engine plays the same opening with white and black
    const result1 = await playSingleGame(
      engine1,
      engine2,
      openingMoves,
      timeLimitMs,
    );
    const result2 = await playSingleGame(
      engine2,
      engine1,
      openingMoves,
      timeLimitMs,
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
  timeLimit: number,
): Promise<Result> {
  const pos = new Position();
  const MAX_PLY = 512;

  await playOpeningMoves(openingMoves, pos);

  while (!pos.gameOver() && pos.fullmoveNumber * 2 < MAX_PLY) {
    const whiteMove = white.search(pos, timeLimit);
    pos.makeMove(whiteMove);

    pos.checkGameOver();
    if (pos.gameOver()) break;

    const blackMove = black.search(pos, timeLimit);
    pos.makeMove(blackMove);

    pos.checkGameOver();
  }

  if (pos.fullmoveNumber * 2 >= MAX_PLY) {
    return DRAW;
  }

  return pos.result;
}
