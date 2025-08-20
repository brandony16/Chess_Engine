import { getAllLegalMoves } from "../moveGeneration/allMoveGeneration.mjs";

/**
 * Gets the "best" move in the given position. This version simply selects a random move.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {number} player - whose move it is (0 for w, 1 for b)
 * @param {Array<boolean>} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {Map} prevPositions - placeholder to have same inputs as other engines
 * @param {number} maxDepth - placeholder to have same inputs as other engines
 * @param {number} timeLimit - placeholder to have same inputs as other engines
 * @returns {{from: number, to: number, promotion: number}} The move found
 */
export const BMV1 = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,

  // placeholders to match inputs of other engines
  prevPositions = new Map(),
  maxDepth = 0,
  timeLimit = Infinity
) => {
  const moves = getAllLegalMoves(
    bitboards,
    player,
    castlingRights,
    enPassantSquare
  );

  return moves[Math.floor(Math.random() * moves.length)];
};
