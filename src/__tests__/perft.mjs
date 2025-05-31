import { getNewEnPassant } from "../components/bitboardUtils/bbChessLogic.mjs";
import { getAllLegalMoves } from "../components/bitboardUtils/moveGeneration/allMoveGeneration.mjs";
import { updateCastlingRights } from "../components/bitboardUtils/moveMaking/castleMoveLogic.mjs";
import {
  makeMove,
  unMakeMove,
} from "../components/bitboardUtils/moveMaking/makeMoveLogic.mjs";
import { moveToUCI } from "../components/bitboardUtils/FENandUCIHelpers.mjs";
import { BLACK, WHITE } from "../components/bitboardUtils/constants.mjs";

/**
 * Count leaf nodes to `depth` by recursively generating, making, and unmaking moves.
 * @param {object} board  Your internal board state
 * @param {number} depth  How many plies to search
 * @returns {number}      Number of leaf nodes at exactly `depth` plies
 */
export function perft(board, player, castling, ep, depth) {
  if (depth === 0) return 1;

  let nodes = 0;
  const opp = player === WHITE ? BLACK : WHITE;

  const moves = getAllLegalMoves(board, player, castling, ep);
  for (const move of moves) {
    makeMove(board, move);

    // New game states
    const newEp = getNewEnPassant(move);
    const newCastling = updateCastlingRights(move.from, move.to, castling);

    nodes += perft(board, opp, newCastling, newEp, depth - 1);

    unMakeMove(move, board);
  }

  return nodes;
}

export function perftDivide(board, player, castling, ep, depth) {
  const divide = {};

  const opp = player === WHITE ? BLACK : WHITE;
  const moves = getAllLegalMoves(board, player, castling, ep);

  for (const move of moves) {
    const uci = moveToUCI(move);
    makeMove(board, move);

    // New game states
    const newEp = getNewEnPassant(move);
    const newCastling = updateCastlingRights(move.from, move.to, castling);
    
    divide[uci] = perft(board, opp, newCastling, newEp, depth - 1);

    unMakeMove(move, board);
  }

  return divide;
}