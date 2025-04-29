/**
 * @typedef {object} Bitboards
 * @property {bigint} whitePawns - bitboard of the white pawns
 * @property {bigint} whiteKnights - bitboard of the white knights
 * @property {bigint} whiteBishops - bitboard of the white bishops
 * @property {bigint} whiteRooks - bitboard of the white rooks
 * @property {bigint} whiteQueens - bitboard of the white queens
 * @property {bigint} whiteKings - bitboard of the white king
 * @property {bigint} blackPawns - bitboard of the black pawns
 * @property {bigint} blackKnights - bitboard of the black knights
 * @property {bigint} blackBishops - bitboard of the black bishops
 * @property {bigint} blackRooks - bitboard of the black rooks
 * @property {bigint} blackQueens - bitboard of the black queens
 * @property {bigint} blackKings - bitboard of the black king
 */

import {
  FILE_A_MASK,
  FILE_H_MASK,
  RANK_1_MASK,
  RANK_8_MASK,
} from "../constants";
import { slide } from "../generalHelpers";
import { getAllPieces } from "../pieceGetters";

/**
 * Gets the attack bitboard for a bishop.
 * @param {Bitboards} bitboards - the bitboards in the current position
 * @param {number} from - the square its moving from
 * @returns {bigint} the move bitboard for the bishop
 */
export const getBishopAttacksForSquare = (bitboards, from) => {
  let bishopBitboard = 1n << BigInt(from);
  let attacks = 0n;

  // Get occupied squares
  const allPieces = getAllPieces(bitboards);

  attacks |= slide(bishopBitboard, 9n, FILE_H_MASK & RANK_8_MASK, allPieces); // Up-right
  attacks |= slide(bishopBitboard, 7n, FILE_A_MASK & RANK_8_MASK, allPieces); // Up-left
  attacks |= slide(bishopBitboard, -7n, FILE_H_MASK & RANK_1_MASK, allPieces); // Down-right
  attacks |= slide(bishopBitboard, -9n, FILE_A_MASK & RANK_1_MASK, allPieces); // Down-left

  return attacks;
};

/**
 * Gets the attack bitboard for a rook.
 * @param {Bitboards} bitboards - the bitboards in the current position
 * @param {number} from - the square its moving from
 * @returns {bigint} the move bitboard for the rook
 */
export const getRookAttacksForSquare = (bitboards, from) => {
  let rookBitboard = 1n << BigInt(from);
  let attacks = 0n;

  const allPieces = getAllPieces(bitboards);

  attacks |= slide(rookBitboard, 1n, FILE_H_MASK, allPieces);
  attacks |= slide(rookBitboard, -1n, FILE_A_MASK, allPieces);
  attacks |= slide(rookBitboard, 8n, RANK_8_MASK, allPieces);
  attacks |= slide(rookBitboard, -8n, RANK_1_MASK, allPieces);

  return attacks;
};

/**
 * Gets the attack bitboard for a queen.
 * @param {Bitboards} bitboards - the bitboards in the current position
 * @param {number} from - the square its moving from
 * @returns {bigint} the move bitboard for the queen
 */
export const getQueenAttacksForSquare = (bitboards, from) => {
  let queenBitboard = 1n << BigInt(from);
  let attacks = 0n;

  const allPieces = getAllPieces(bitboards);

  // Orthogonal Moves
  attacks |= slide(queenBitboard, 1n, FILE_H_MASK, allPieces); // Right
  attacks |= slide(queenBitboard, -1n, FILE_A_MASK, allPieces); // Left
  attacks |= slide(queenBitboard, 8n, RANK_8_MASK, allPieces); // Up
  attacks |= slide(queenBitboard, -8n, RANK_1_MASK, allPieces); // Down

  // Diagonal Moves
  attacks |= slide(queenBitboard, 9n, FILE_H_MASK & RANK_8_MASK, allPieces); // Up-right
  attacks |= slide(queenBitboard, 7n, FILE_A_MASK & RANK_8_MASK, allPieces); // Up-left
  attacks |= slide(queenBitboard, -7n, FILE_H_MASK & RANK_1_MASK, allPieces); // Down-right
  attacks |= slide(queenBitboard, -9n, FILE_A_MASK & RANK_1_MASK, allPieces); // Down-left

  return attacks;
};
