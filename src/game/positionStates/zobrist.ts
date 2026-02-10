import { NUM_PIECES } from "../chessConstants.ts";

/**
 * Generates a random 64 bit integer
 * @returns {bigint} - a random bigint
 */
function rand64(): bigint {
  // Create two 32-bit random integers
  const high = Math.floor(Math.random() * 0x100000000);
  const low = Math.floor(Math.random() * 0x100000000);

  // Combine them into a 64-bit BigInt
  return (BigInt(high) << 32n) | BigInt(low);
}

/**
 * Zobrist table for hashing. Creates a unique bitstring for every piece at every square.
 * 12 bitboards and 64 squares, KQRBNP for each side. Index of a piece at a square is the
 * piece number multiplied by 64 plus the sqaure number. A white pawn moving to a4 would be
 * 0 (white pawn) * 64 + 24 (a4)
 */
export const zobristTable = new BigUint64Array(NUM_PIECES * 64);

// populate:
for (let p = 0; p < NUM_PIECES; p++) {
  for (let sq = 0; sq < 64; sq++) {
    zobristTable[p * 64 + sq] = rand64();
  }
}

/**
 * Create En Passant keys for hashing. One for each file
 */
export const EN_PASSANT_ZOBRIST: readonly bigint[] = Array.from(
  { length: 8 },
  () => rand64(),
);

// 16 possible castling-rights bitmasks (0–15)
export const CASTLING_ZOBRIST: readonly bigint[] = Array.from(
  { length: 16 },
  (_, i) => (i === 0 ? 0n : rand64()),
);

/**
 * A player key used for hashing
 */
export const SIDE_TO_MOVE_ZOBRIST = rand64();
