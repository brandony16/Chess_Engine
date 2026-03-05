import type { File, Rank, Square } from "../chessConstants.ts";

/**
 * A helper to determine whether a square is on a board
 */
export function isOnBoard(sq: number) {
  return sq >= 0 && sq < 64;
}

/**
 * A helper to get the rank a square is on
 */
export function getRank(sq: Square): Rank {
  return Math.floor(sq / 8) as Rank;
}

/**
 * A helper to get the file a square is on
 */
export function getFile(sq: Square): File {
  return (sq % 8) as File;
}

/**
 * Helper to turn a Rank and File into a square
 */
export function getSquare(r: Rank, f: File): Square {
  const sq = r * 8 + f;
  return sq as Square;
}
