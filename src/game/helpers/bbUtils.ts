import type { Square } from "../chessConstants.ts";

// De Brujin Lookup
const DEBRUIJN64 = 0x03f79d71b4cb0a89n;

// Maps a 6-bit pattern to an index
const INDEX64: Square[] = [
  0, 1, 48, 2, 57, 49, 28, 3, 61, 58, 50, 42, 38, 29, 17, 4, 62, 55, 59, 36, 53,
  51, 43, 22, 45, 39, 33, 30, 24, 18, 12, 5, 63, 47, 56, 27, 60, 41, 37, 16, 54,
  35, 52, 21, 44, 32, 23, 11, 46, 26, 40, 15, 34, 20, 31, 10, 25, 14, 19, 9, 13,
  8, 7, 6,
];

/**
 * Finds the index of the first square that is a 1 (least significant bit) using De Brujin lookup.
 */
export const bitScanForward = (bitboard: bigint): Square => {
  if (bitboard === 0n) return -1;

  const lsb = bitboard & -bitboard;

  // Truncate to 64 bits
  const truncated = BigInt.asUintN(64, lsb * DEBRUIJN64);

  // Shifting 58 bits leaves the top 6 bits, which encodes the position
  const idx = Number(truncated >> 58n);

  return INDEX64[idx];
};

/**
 * Count the number of 1-bits in a BigInt.
 */
export function popcount(bb: bigint): number {
  let lo = Number(bb & 0xffffffffn);
  let hi = Number((bb >> 32n) & 0xffffffffn);
  return popcount32(lo) + popcount32(hi);
}

function popcount32(x: number): number {
  // Hacker’s Delight popcount32
  x -= (x >>> 1) & 0x55555555;
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

/**
 * Gets the indexes of all of the set bits in a bitboard.
 *
 * @param {bigint} mask - the bitboard
 * @returns {Array<number>} an array of square indexes
 */
export function maskBits(mask: bigint): number[] {
  const bits = [];
  let b = mask;
  while (b) {
    const bitIndex = bitScanForward(b);
    bits.push(bitIndex);

    b &= b - 1n;
  }
  return bits;
}
