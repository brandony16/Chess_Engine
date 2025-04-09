import { getFile, getRank } from "../bbHelpers";

/**
 * Computes a rook move mask for a square
 * @param {number} square - the square for the rook mask
 * @returns {bigint} the rook mask for the square
 */
const computeRookMask = (square) => {
  let mask = 0n;

  const rank = getRank(square);
  const file = getFile(square);

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
  return mask;
};

/**
 * Calculates the rook attack maps for every square on the board.
 * @returns {Array} an array of every rook move mask
 */
const initializeRookMasks = () => {
  const rookMasks = new Array(64);

  for (let sq = 0; sq < 64; sq++) {
    rookMasks[sq] = computeRookMask(sq);
  }

  return rookMasks;
};

// The rook masks
export const rookMasks = initializeRookMasks();
