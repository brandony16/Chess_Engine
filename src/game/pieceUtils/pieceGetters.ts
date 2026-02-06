import {
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../chessConstants.ts";

/**
 * Gets a bitboard of all of the pawns in a position, regardless of color
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @returns {bigint} bitboard of all pawns
 */
export function pawns(bitboards: BigUint64Array): bigint {
  return bitboards[WHITE_PAWN] | bitboards[BLACK_PAWN];
}

/**
 * Gets a bitboard of all of the knights in a position, regardless of color
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @returns {bigint} bitboard of all knights
 */
export function knights(bitboards: BigUint64Array): bigint {
  return bitboards[WHITE_KNIGHT] | bitboards[BLACK_KNIGHT];
}

/**
 * Gets a bitboard of all of the bishops in a position, regardless of color
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @returns {bigint} bitboard of all bishops
 */
export function bishops(bitboards: BigUint64Array): bigint {
  return bitboards[WHITE_BISHOP] | bitboards[BLACK_BISHOP];
}

/**
 * Gets a bitboard of all of the rooks in a position, regardless of color
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @returns {bigint} bitboard of all rooks
 */
export function rooks(bitboards: BigUint64Array): bigint {
  return bitboards[WHITE_ROOK] | bitboards[BLACK_ROOK];
}

/**
 * Gets a bitboard of all of the queens in a position, regardless of color
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @returns {bigint} bitboard of all queens
 */
export function queens(bitboards: BigUint64Array): bigint {
  return bitboards[WHITE_QUEEN] | bitboards[BLACK_QUEEN];
}

/**
 * Gets a bitboard of all of the kings in a position, regardless of color
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @returns {bigint} bitboard of all kings
 */
export function kings(bitboards: BigUint64Array): bigint {
  return bitboards[WHITE_KING] | bitboards[BLACK_KING];
}
