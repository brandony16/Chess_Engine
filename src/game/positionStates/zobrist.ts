import { mulberry32 } from "../../random.ts";
import { PIECE_N, PIECES } from "../chessConstants.ts";

const rng = mulberry32(16);

/**
 * Generates a random 32 bit integer
 * @returns {number} - a random number
 */
const rand32 = (): number => (rng() * 0x100000000) >>> 0;

/**
 * Zobrist table for hashing. Creates a unique bitstring for every piece at every square.
 * 12 bitboards and 64 squares, KQRBNP for each side. Index of a piece at a square is the
 * piece number multiplied by 64 plus the sqaure number. A white pawn moving to a4 would be
 * 0 (white pawn) * 64 + 24 (a4)
 */
export const zobristTableLo = new Uint32Array(PIECE_N * 64);
export const zobristTableHi = new Uint32Array(PIECE_N * 64);

// populate:
for (const p of PIECES) {
  for (let sq = 0; sq < 64; sq++) {
    zobristTableLo[p * 64 + sq] = rand32();
    zobristTableHi[p * 64 + sq] = rand32();
  }
}

/**
 * Create En Passant keys for hashing. One for each file
 */
export const EN_PASSANT_ZOBRIST_LO = new Uint32Array(8);
export const EN_PASSANT_ZOBRIST_HI = new Uint32Array(8);
for (let i = 0; i < 8; i++) {
  EN_PASSANT_ZOBRIST_LO[i] = rand32();
  EN_PASSANT_ZOBRIST_HI[i] = rand32();
}

// 16 possible castling-rights bitmasks (0–15)
export const CASTLING_ZOBRIST_LO = new Uint32Array(16);
export const CASTLING_ZOBRIST_HI = new Uint32Array(16);
for (let i = 0; i < 16; i++) {
  CASTLING_ZOBRIST_LO[i] = rand32();
  CASTLING_ZOBRIST_HI[i] = rand32();
}

/**
 * A player key used for hashing
 */
export const SIDE_ZOBRIST_LO = rand32();
export const SIDE_ZOBRIST_HI = rand32();
