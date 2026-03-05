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

/**
 * Calculates the white pawn attack maps for every square on the board.
 */
const initializeWPawnAttackMasks = (): bigint[] => {
  const whitePawnMasks = new Array(64);
  for (const s of Object.values(sq)) {
    whitePawnMasks[s] = computeWhitePawnMask(s);
  }

  return whitePawnMasks;
};

// The white pawn attack masks
export const whitePawnMasks = initializeWPawnAttackMasks();

/**
 * Calculates the black pawn attack maps for every square on the board.
 */
const initializeBPawnAttackMasks = (): bigint[] => {
  const blackPawnMasks = new Array(64);
  for (const s of Object.values(sq)) {
    blackPawnMasks[s] = computeBlackPawnMask(s);
  }

  return blackPawnMasks;
};

// The white pawn attack masks
export const blackPawnMasks = initializeBPawnAttackMasks();
