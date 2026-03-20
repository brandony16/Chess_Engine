import { bbFromBigInt } from "../bb.ts";
import { sq, type Square } from "../chessConstants.ts";

/**
 * Computes a white pawn attack mask for a square.
 */
const computeWhitePawnMask = (square: Square): bigint => {
  const pawn = 1n << BigInt(square);
  let attacks = 0n;

  if (square % 8 !== 0) {
    // not on file A
    attacks |= pawn << 7n;
  }
  if (square % 8 !== 7) {
    // not on file H
    attacks |= pawn << 9n;
  }
  return attacks;
};

/**
 * Computes a black pawn attack mask for a square.
 */
const computeBlackPawnMask = (square: Square): bigint => {
  const pawn = 1n << BigInt(square);
  let attacks = 0n;

  if (square % 8 !== 0) {
    // not on file A
    attacks |= pawn >> 9n;
  }
  if (square % 8 !== 7) {
    // not on file H
    attacks |= pawn >> 7n;
  }
  return attacks;
};

export const wPMasksLo = new Int32Array(64);
export const wPMasksHi = new Int32Array(64);
export const bPMasksLo = new Int32Array(64);
export const bPMasksHi = new Int32Array(64);

/**
 * Calculates the white pawn attack maps for every square on the board.
 */
const initializeWhitePawnAttackMasks = () => {
  for (const s of Object.values(sq)) {
    const [lo, hi] = bbFromBigInt(computeWhitePawnMask(s));
    wPMasksLo[s] = lo;
    wPMasksHi[s] = hi;
  }
};

/**
 * Calculates the black pawn attack maps for every square on the board.
 */
const initializeBlackPawnAttackMasks = () => {
  for (const s of Object.values(sq)) {
    const [lo, hi] = bbFromBigInt(computeBlackPawnMask(s));
    bPMasksLo[s] = lo;
    bPMasksHi[s] = hi;
  }
};

initializeWhitePawnAttackMasks();
initializeBlackPawnAttackMasks();
