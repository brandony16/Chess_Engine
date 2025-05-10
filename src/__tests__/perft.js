import { BLACK, WHITE } from "chess.js";
import { getNewEnPassant } from "../components/bitboardUtils/bbChessLogic";
import { getAllLegalMoves } from "../components/bitboardUtils/moveGeneration/allMoveGeneration";
import { updateCastlingRights } from "../components/bitboardUtils/moveMaking/castleMoveLogic";
import {
  makeMove,
  unMakeMove,
} from "../components/bitboardUtils/moveMaking/makeMoveLogic";
import { bitboardsToFEN } from "../components/bitboardUtils/FENandUCIHelpers";

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
    const newCastling = updateCastlingRights(move.from, castling);
    const newFen = bitboardsToFEN(board, opp, newCastling, newEp);

    nodes += perft(
      board,
      opp,
      newCastling,
      newEp,
      depth - 1,
      newFen,
    );

    unMakeMove(move, board);
  }

  return nodes;
}
