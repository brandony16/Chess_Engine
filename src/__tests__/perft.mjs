import { getNewEnPassant } from "../components/bitboardUtils/bbChessLogic.mjs";
import { getAllLegalMoves } from "../components/bitboardUtils/moveGeneration/allMoveGeneration.mjs";
import { updateCastlingRights } from "../components/bitboardUtils/moveMaking/castleMoveLogic.mjs";
import {
  makeMove,
  unMakeMove,
} from "../components/bitboardUtils/moveMaking/makeMoveLogic.mjs";
import { moveToUCI } from "../components/bitboardUtils/FENandUCIHelpers.mjs";
import { BLACK, WHITE } from "../components/bitboardUtils/constants.mjs";
import { getAttackMask } from "../components/bitboardUtils/PieceMasks/attackMask.mjs";
import { bigIntFullRep } from "../components/bitboardUtils/debugFunctions.mjs";
import { computeAllAttackMasks, individualAttackMasks } from "../components/bitboardUtils/PieceMasks/individualAttackMasks.mjs";

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
  const oldMasks = individualAttackMasks.slice();

  const moves = getAllLegalMoves(board, player, castling, ep);
  for (const move of moves) {
    makeMove(board, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(board);

    try {
      equal(afterMoveAttackMasks, individualAttackMasks);
    } catch (e) {
      console.log(bigIntFullRep(board[10]));
      throw e;
    }
    

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

function equal(masks1, masks2) {
  for (let i = 0; i < masks1.length; i++) {
    if (masks1[i] !== masks2[i]) {
      console.log(i);
      console.log(bigIntFullRep(masks1[i]));
      console.log(bigIntFullRep(masks2[i]));
      throw new Error("nuh uh")
    }
  }
  return true;
}