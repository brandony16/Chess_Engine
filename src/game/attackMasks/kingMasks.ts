import { bbFromBigInt } from "../bb.ts";
import { sq, type Square } from "../chessConstants.ts";
import { isOnBoard } from "../helpers/boardUtils.ts";

// The king square offsets
const KING_OFFSETS = [1, 7, 8, 9, -1, -7, -8, -9];

/**
 * Computes a king move mask for a square. Does not do castling.
 */
const computeKingMask = (square: Square): bigint => {
  let mask = 0n;

  for (const offset of KING_OFFSETS) {
    const target = square + offset;
    if (isOnBoard(target) && isValidKingMove(square, target as Square)) {
      mask |= 1n << BigInt(target);
    }
  }
  return mask;
};

/**
 * Determines whether a king move wraps around the board. Returns false if it does.
 */
const isValidKingMove = (source: Square, dest: Square): boolean => {
  // Compute rank and file for source and destination:
  const sourceFile = source % 8;
  const destFile = dest % 8;

  const fileDiff = Math.abs(sourceFile - destFile);

  // King can move one or two files.
  // Rank wrapping is handled by isOnBoard
  if (fileDiff !== 1 && fileDiff !== 0) {
    return false;
  }
  return true;
};

export const kingMasksLo = new Int32Array(64);
export const kingMasksHi = new Int32Array(64);

/**
 * Initializes an array of king masks for every square.
 */
const initializeKingMasks = () => {
  for (const s of Object.values(sq)) {
    const [lo, hi] = bbFromBigInt(computeKingMask(s));
    kingMasksLo[s] = lo;
    kingMasksHi[s] = hi;
  }
};

initializeKingMasks();
