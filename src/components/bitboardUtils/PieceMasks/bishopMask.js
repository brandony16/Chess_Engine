import { getFile, getRank } from "../bbHelpers";

/**
 * Computes a bishop attack mask from a square
 * 
 * @param {number} square - the square of the bishop
 * @returns {bigint} the bishop attack mask
 */
const computeBishopMask = (square) => {
  let mask = 0n;
  const rank = getRank(square);
  const file = getFile(square);

  // North-East
  for (let r = rank + 1, f = file + 1; r < 8 && f < 8; r++, f++) {
    mask |= 1n << BigInt(r * 8 + f);
  }
  // North-West
  for (let r = rank + 1, f = file - 1; r < 8 && f >= 0; r++, f--) {
    mask |= 1n << BigInt(r * 8 + f);
  }
  // South-East
  for (let r = rank - 1, f = file + 1; r >= 0 && f < 8; r--, f++) {
    mask |= 1n << BigInt(r * 8 + f);
  }
  // South-West
  for (let r = rank - 1, f = file - 1; r >= 0 && f >= 0; r--, f--) {
    mask |= 1n << BigInt(r * 8 + f);
  }
  return mask;
}

/**
 * Calculates the bishop attack masks for every square as if 
 * there was a bishop there.
 * @returns {Array} the bishop masks
 */
const initializeBishopMasks = () => {
  const bishopMasks = new Array(64);

  for (let sq = 0; sq < 64; sq++) {
    bishopMasks[sq] = computeBishopMask(sq);
  }

  return bishopMasks;
};

// The bishop masks
export const bishopMasks = initializeBishopMasks();