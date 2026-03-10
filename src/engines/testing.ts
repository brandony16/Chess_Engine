import {
  BLACK_WIN,
  DRAW,
  WHITE_WIN,
  type Result,
} from "../game/chessConstants.ts";
import { uciToMove } from "../game/fenAndUCI/uciHelpers.ts";
import type Move from "../game/moveMaking/move.ts";
import { Position } from "../game/Position.ts";

export type Engine = {
  name: string;
  search(pos: Position, maxTimeMs: number): Move;
};

type MatchResult = {
  engine1Wins: number;
  engine2Wins: number;
  draws: number;
};
export const runMatch = async (
  engine1: Engine,
  engine2: Engine,
  numGames: number,
  timeLimitMs: number = 1000,
  seed: number = 1,
) => {
  const res: MatchResult = { engine1Wins: 0, engine2Wins: 0, draws: 0 };

  const rng = mulberry32(seed);

  const recordResult = (result: Result, white: Engine, black: Engine) => {
    switch (result) {
      case DRAW:
        res.draws++;
        break;
      case WHITE_WIN:
        if (white === engine1) {
          res.engine1Wins++;
        } else {
          res.engine2Wins++;
        }
        break;
      case BLACK_WIN:
        if (black === engine1) {
          res.engine1Wins++;
        } else {
          res.engine2Wins++;
        }
        break;
    }
  };

  for (let i = 0; i < numGames; i += 2) {
    const gameSeed = Math.floor(rng() * 1e9);
    const openingMoves = await getOpeningMoves(gameSeed);

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

  return res;
};

async function playSingleGame(
  white: Engine,
  black: Engine,
  openingMoves: string[],
  timeLimit: number,
): Promise<Result> {
  const pos = new Position();

  await playOpeningMoves(openingMoves, pos);

  while (!pos.gameOver()) {
    const whiteMove = white.search(pos, timeLimit);
    pos.makeMove(whiteMove);

    pos.checkGameOver();
    if (pos.gameOver()) break;

    const blackMove = black.search(pos, timeLimit);
    pos.makeMove(blackMove);

    pos.checkGameOver();
  }

  return pos.result;
}

/**
 * Gets a sequence of 8 opening moves (ply) for engines to play from.
 * Used so engines don't play the same game every time.
 */
export async function getOpeningMoves(seed?: number): Promise<string[]> {
  const res = await fetch(`/openings.json`);
  if (!res.ok) throw new Error("Error fetching opening moves");

  const openings: string[][] = await res.json();

  const rng = seed !== undefined ? mulberry32(seed) : Math.random;

  const randIndex = Math.floor(rng() * openings.length);

  return openings[randIndex];
}

export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Plays a random 4 move (8 ply) opening
 */
export const playOpeningMoves = async (moves: string[], pos: Position) => {
  for (const uciMove of moves) {
    const move = uciToMove(uciMove, pos);
    pos.makeMove(move);
  }
};
