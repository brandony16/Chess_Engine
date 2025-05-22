import { getAllLegalMoves } from "../allMoveGeneration";

/**
 * Generates quiescence moves for a position. These are captures and promotions.
 * Helps avoid the horizon effect where engines cant correctly evaluate capture
 * sequences due to limited depth.
 * @param {BigUint64Array} bitboards - the bitboard of the position
 * @param {0 | 1} player - whose moves to get
 * @param {number} enPassantSquare - the en passant square
 * @returns {Array<Move>} - the quiescence moves
 */
export const getQuiescenceMoves = (bitboards, player, enPassantSquare) => {
  const moves = getAllLegalMoves(bitboards, player, null, enPassantSquare);

  return moves.filter((move) => move.captured !== null || move.promotion);
};
