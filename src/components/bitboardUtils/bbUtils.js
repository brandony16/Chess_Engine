/**
 * A helper to determine whether a square is on a board
 * @param {number} sq - the square
 * @returns {boolean} whether or not the square is on the board
 */
export const isOnBoard = (sq) => {
  return sq >= 0 && sq < 64;
};

/**
 * A helper to get the rank a square is on
 * @param {number} sq - the square on the board
 * @returns {number} the rank of the square
 */
export function getRank(sq) {
  return Math.floor(sq / 8);
}

/**
 * A helper to get the file a square is on
 * @param {number} sq - the square on the board
 * @returns {number} the file of the square
 */
export function getFile(sq) {
  return sq % 8;
}

/**
 * Iterates over a bitboard and finds the first square that is a 1. Returns that index.
 *
 * @param {bigint} bitboard - the bitboard to count the pieces of
 * @returns {number} index of least signifigant bit
 */
export const bitScanForward = (bitboard) => {
  if (bitboard === 0n) return -1;
  let index = 0;
  while ((bitboard & 1n) === 0n) {
    bitboard >>= 1n;
    index++;
  }
  return index;
};

/**
 * Gets the number of pieces a bitboard has. Counts each signifigant bit.
 *
 * @param {bigint} bitboard - the bitboard to count the pieces of
 * @returns {number} number of pieces
 */
export const getNumPieces = (bitboard) => {
  let count = 0;

  while (bitboard) {
    bitboard &= bitboard - 1n;
    count++;
  }

  return count;
};