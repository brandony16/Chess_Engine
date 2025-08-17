import { NUM_PIECES, PIECE_SYMBOLS } from "./constants.mjs";

/**
 * Converts a big int to an 8x8 grid of 1s and 0s.
 * Used for debugging to be able to see what bits are and aren't flipped.
 *
 * @param {bigint} bitboard - the bitboard to count the pieces of
 * @returns {string} bitboard as a string in a 8x8 grid
 */
export function bigIntFullRep(bitboard) {
  let boardStr = "";

  for (let rank = 7; rank >= 0; rank--) {
    // Ranks go from 8 (top) to 1 (bottom)
    let row = "";
    for (let file = 0; file < 8; file++) {
      // Files go from A (left) to H (right)
      let square = BigInt(1) << BigInt(rank * 8 + file);
      row += bitboard & square ? "1 " : "0 ";
    }
    boardStr += row.trim() + "\n"; // Add each row to the board string
  }

  return boardStr;
}

/**
 * Determines if two bitboard arrays are equal.
 * Mainly used for debugging.
 *
 * @param {BigUint64Array} a - the first set of bitboards
 * @param {BigUint64Array} b - the second set of bitboards
 * @returns {boolean} if they are equal
 */
export function areBigUint64ArraysEqual(a, b) {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

/**
 * Logs all of the bitboards to the console in a readable format
 * with bigIntFullRep. Used for debugging
 *
 * @param {BigUint64Array} bitboards - the bitboards of the position
 */
export function logAllBitboards(bitboards) {
  for (let i = 0; i < NUM_PIECES; i++) {
    const bitboard = bitboards[i];
    console.log(PIECE_SYMBOLS[i]);
    console.log(bigIntFullRep(bitboard));
  }
}
