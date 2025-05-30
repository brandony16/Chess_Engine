import { getNewEnPassant } from "./bbChessLogic.mjs";
import { BLACK, WHITE } from "./constants.mjs";
import { getFENData, moveToUCI } from "./FENandUCIHelpers.mjs";
import { getAllLegalMoves } from "./moveGeneration/allMoveGeneration.mjs";
import { updateCastlingRights } from "./moveMaking/castleMoveLogic.mjs";
import { makeMove, unMakeMove } from "./moveMaking/makeMoveLogic.mjs";
import { initializePieceAtArray } from "./pieceGetters.mjs";
import { initializePieceIndicies } from "./pieceIndicies.mjs";
import { computeAllAttackMasks } from "./PieceMasks/individualAttackMasks.mjs";

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

function go() {
  const fenData = getFENData(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );
  const bitboards = fenData.bitboards;
  const player = fenData.player;
  const castling = fenData.castling;
  const ep = fenData.ep;

  initializePieceIndicies(bitboards);
  computeAllAttackMasks(bitboards);
  initializePieceAtArray(bitboards);

  const div = perftDivide(bitboards, player, castling, ep, 5);
  console.table(div);
}

go();