import { getNewEnPassant } from "../components/bitboardUtils/bbChessLogic";
import { getAllLegalMoves } from "../components/bitboardUtils/moveGeneration/allMoveGeneration";
import { updateCastlingRights } from "../components/bitboardUtils/moveMaking/castleMoveLogic";
import {
  makeMove,
  unMakeMove,
} from "../components/bitboardUtils/moveMaking/makeMoveLogic";
import { getCachedAttackMask, updateAttackMaskHash } from "../components/bitboardUtils/PieceMasks/attackMask";
import { moveToUCI } from "../components/bitboardUtils/FENandUCIHelpers";
import { BLACK, WHITE, WHITE_KNIGHT } from "../components/bitboardUtils/constants";
import { bigIntFullRep } from "../components/bitboardUtils/generalHelpers";
import { individualAttackMasks } from "../components/bitboardUtils/PieceMasks/individualAttackMasks";

/**
 * Count leaf nodes to `depth` by recursively generating, making, and unmaking moves.
 * @param {object} board  Your internal board state
 * @param {number} depth  How many plies to search
 * @returns {number}      Number of leaf nodes at exactly `depth` plies
 */
export function perft(board, player, castling, ep, prevAttackHash, depth) {
  if (depth === 0) return 1;

  let nodes = 0;
  const opp = player === WHITE ? BLACK : WHITE;

  const moves = getAllLegalMoves(board, player, castling, ep, prevAttackHash);
  for (const move of moves) {
    makeMove(board, move);

    // New game states
    const newEp = getNewEnPassant(move);
    const newCastling = updateCastlingRights(move.from, castling);

    const attackHash = updateAttackMaskHash(
      board,
      prevAttackHash,
      move,
      player,
      newEp
    );

    nodes += perft(board, opp, newCastling, newEp, attackHash, depth - 1);

    unMakeMove(move, board);
  }

  return nodes;
}

export function perftDivide(
  board,
  player,
  castling,
  ep,
  prevAttackHash,
  depth
) {
  const divide = {};

  const opp = player === WHITE ? BLACK : WHITE;
  const moves = getAllLegalMoves(board, player, castling, ep, prevAttackHash);

  for (const move of moves) {
    const uci = moveToUCI(move);
    makeMove(board, move);
    
    // New game states
    const newEp = getNewEnPassant(move);
    const newCastling = updateCastlingRights(move.from, castling);
    
    const attackHash = updateAttackMaskHash(
      board,
      prevAttackHash,
      move,
      player,
      newEp
    );

    divide[uci] = perft(board, opp, newCastling, newEp, attackHash, depth - 1);

    unMakeMove(move, board);
  }

  return divide;
}
