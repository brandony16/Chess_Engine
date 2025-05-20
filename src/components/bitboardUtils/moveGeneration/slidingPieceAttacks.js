import {
  FILE_A_MASK,
  FILE_H_MASK,
  RANK_1_MASK,
  RANK_8_MASK,
} from "../constants";
import { slide } from "../generalHelpers";

/**
 * Gets the attack bitboard for a bishop.
 * @param {bigint} occupancy - the occupancy bitboard of all pieces
 * @param {number} from - the square its moving from
 * @returns {bigint} the move bitboard for the bishop
 */
export function getBishopAttacksForSquare(occupancy, from) {
  let bishopBitboard = 1n << BigInt(from);
  let attacks = 0n;

  attacks |= slide(bishopBitboard, 9n, FILE_H_MASK & RANK_8_MASK, occupancy); // Up-right
  attacks |= slide(bishopBitboard, 7n, FILE_A_MASK & RANK_8_MASK, occupancy); // Up-left
  attacks |= slide(bishopBitboard, -7n, FILE_H_MASK & RANK_1_MASK, occupancy); // Down-right
  attacks |= slide(bishopBitboard, -9n, FILE_A_MASK & RANK_1_MASK, occupancy); // Down-left

  return attacks;
}

/**
 * Gets the attack bitboard for a rook.
 * @param {bigint} occupancy - the occupancy bitboard of all pieces
 * @param {number} from - the square its moving from
 * @returns {bigint} the move bitboard for the rook
 */
export function getRookAttacksForSquare(occupancy, from) {
  let rookBitboard = 1n << BigInt(from);
  let attacks = 0n;

  attacks |= slide(rookBitboard, 1n, FILE_H_MASK, occupancy);
  attacks |= slide(rookBitboard, -1n, FILE_A_MASK, occupancy);
  attacks |= slide(rookBitboard, 8n, RANK_8_MASK, occupancy);
  attacks |= slide(rookBitboard, -8n, RANK_1_MASK, occupancy);

  return attacks;
}

/**
 * Gets the attack bitboard for a queen.
 * @param {bigint} occupancy - the occupancy bitboard of all pieces
 * @param {number} from - the square its moving from
 * @returns {bigint} the move bitboard for the queen
 */
export function getQueenAttacksForSquare(occupancy, from) {
  let queenBitboard = 1n << BigInt(from);
  let attacks = 0n;

  // Orthogonal Moves
  attacks |= slide(queenBitboard, 1n, FILE_H_MASK, occupancy); // Right
  attacks |= slide(queenBitboard, -1n, FILE_A_MASK, occupancy); // Left
  attacks |= slide(queenBitboard, 8n, RANK_8_MASK, occupancy); // Up
  attacks |= slide(queenBitboard, -8n, RANK_1_MASK, occupancy); // Down

  // Diagonal Moves
  attacks |= slide(queenBitboard, 9n, FILE_H_MASK & RANK_8_MASK, occupancy); // Up-right
  attacks |= slide(queenBitboard, 7n, FILE_A_MASK & RANK_8_MASK, occupancy); // Up-left
  attacks |= slide(queenBitboard, -7n, FILE_H_MASK & RANK_1_MASK, occupancy); // Down-right
  attacks |= slide(queenBitboard, -9n, FILE_A_MASK & RANK_1_MASK, occupancy); // Down-left

  return attacks;
}
