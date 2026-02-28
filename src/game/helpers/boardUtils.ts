import type { Square } from "../chessConstants.ts";

/**
 * A helper to determine whether a square is on a board
 */
export function isOnBoard(sq: Square) {
  return sq >= 0 && sq < 64;
}

/**
 * A helper to get the rank a square is on
 */
export function getRank(sq: Square) {
  return Math.floor(sq / 8);
}

/**
 * A helper to get the file a square is on
 */
export function getFile(sq: Square) {
  return sq % 8;
}
