import { uciToMove } from "../../game/fenAndUCI/uciHelpers.ts";
import type { Position } from "../../game/Position.ts";
import { mulberry32 } from "../../random.ts";
import path from "path";
import { readFile } from "fs/promises";

export async function fetchOpenings(): Promise<string[][]> {
  const filePath = path.resolve("./public/openings.json");

  const data = await readFile(filePath, "utf-8");

  const openings = JSON.parse(data);

  return openings;
}

/**
 * Gets a sequence of 8 opening moves (ply) for engines to play from.
 * Used so engines don't play the same game every time.
 */
export async function getRandomOpening(
  openings: string[][],
  seed?: number,
): Promise<string[]> {
  const rng = seed !== undefined ? mulberry32(seed) : Math.random;

  const randIndex = Math.floor(rng() * openings.length);

  return openings[randIndex];
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
