import { getFile, getRank } from "../bbHelpers";

/**
 * Computes a move mask for a queen at a square
 * 
 * @param {number} square - the square the queen is at
 * @returns {bigint} the queen mask for the square
 */
const computeQueenMask = (square) => {
  let mask = 0n;

  const rank = getRank(square);
  const file = getFile(square);

  // Orthogonal Moves
  for (let r = rank + 1; r < 8; r++) {
    mask |= 1n << BigInt(r * 8 + file);
  }
  for (let r = rank - 1; r >= 0; r--) {
    mask |= 1n << BigInt(r * 8 + file);
  }
  for (let f = file + 1; f < 8; f++) {
    mask |= 1n << BigInt(rank * 8 + f);
  }
  for (let f = file - 1; f >= 0; f--) {
    mask |= 1n << BigInt(rank * 8 + f);
  }

  // Diagonal Moves
  for (let r = rank + 1, f = file + 1; r < 8 && f < 8; r++, f++) {
    mask |= 1n << BigInt(r * 8 + f);
  }
  for (let r = rank + 1, f = file - 1; r < 8 && f >= 0; r++, f--) {
    mask |= 1n << BigInt(r * 8 + f);
  }
  for (let r = rank - 1, f = file + 1; r >= 0 && f < 8; r--, f++) {
    mask |= 1n << BigInt(r * 8 + f);
  }
  for (let r = rank - 1, f = file - 1; r >= 0 && f >= 0; r--, f--) {
    mask |= 1n << BigInt(r * 8 + f);
  }
  return mask;
};

/**
 * Calculates the queen attack maps for every square on the board.
 * @returns {Array} an array of every queen move mask
 */
const initializeQueenMasks = () => {
  const queenMasks = new Array(64);

  for (let sq = 0; sq < 64; sq++) {
    queenMasks[sq] = computeQueenMask(sq);
  }

  return queenMasks;
};

// The queen masks
export const queenMasks = initializeQueenMasks();