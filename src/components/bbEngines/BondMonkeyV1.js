import { allLegalMovesArr } from "../bitboardUtils/generalHelpers";

/**
 * @typedef {object} CastlingRights
 * @property {boolean} whiteKingside - Whether castling kingside is legal for white
 * @property {boolean} whiteQueenside - Whether castling queenside is legal for white
 * @property {boolean} blackKingside - Whether castling kingside is legal for black
 * @property {boolean} blackQueenside - Whether castling queenside is legal for black
 */

/**
 * Gets the "best" move in the given position. This version simply selects a random move.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {int} player - whose move it is (0 for w, 1 for b)
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {int} enPassantSquare - the square where en passant is legal
 * @param {int} depth - placeholder to have same inputs as other engines
 * @param {int} timeLimit - placeholder to have same inputs as other engines
 * @returns {{from: int, to: int, promotion: int}} The move found
 */
export const BMV1 = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  depth = 0,
  timeLimit = Infinity
) => {
  const moves = allLegalMovesArr(
    bitboards,
    player,
    castlingRights,
    enPassantSquare
  );

  return moves[Math.floor(Math.random() * moves.length)];
};
