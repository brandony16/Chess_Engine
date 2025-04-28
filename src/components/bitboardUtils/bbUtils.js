
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

// De Brujin Lookup
const DEBRUIJN64 = 0x03f79d71b4cb0a89n;

// Maps a 6-bit pattern to an index
const INDEX64 = [
  0, 1, 48, 2, 57, 49, 28, 3, 61, 58, 50, 42, 38, 29, 17, 4, 62, 55, 59, 36, 53,
  51, 43, 22, 45, 39, 33, 30, 24, 18, 12, 5, 63, 47, 56, 27, 60, 41, 37, 16, 54,
  35, 52, 21, 44, 32, 23, 11, 46, 26, 40, 15, 34, 20, 31, 10, 25, 14, 19, 9, 13,
  8, 7, 6,
];

/**
 * Finds the index of the first square that is a 1 using De Brujin lookup.
 * 
 *
 * @param {bigint} bitboard - the bitboard to find the index of the least significant bit 
 * @returns {number} index of least signifigant bit
 */
export const bitScanForward = (bitboard) => {
  if (bitboard === 0n) return -1;

  const lsb = bitboard & -bitboard;

  // Truncate to 64 bits
  const truncated = BigInt.asUintN(64, lsb * DEBRUIJN64);

  // Shifting 58 bits leaves the top 6 bits, which encodes the position
  const idx = Number(truncated >> 58n);

  return INDEX64[idx];
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
