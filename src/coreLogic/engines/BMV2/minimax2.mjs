import { updateCastlingRights } from "../../moveMaking/castleMoveLogic.mjs";
import { makeMove, unMakeMove } from "../../moveMaking/makeMoveLogic.mjs";
import { updateHash } from "../../zobristHashing.mjs";
import { checkGameOver } from "../../gameOverLogic.mjs";
import { getNewEnPassant, isInCheck } from "../../bbChessLogic.mjs";
import { BLACK, WEIGHTS, WHITE } from "../../constants.mjs";
import { evaluate2 } from "./evaluation2.mjs";
import { getAllLegalMoves } from "../../moveGeneration/allMoveGeneration.mjs";

/**
 * A minimax function that recursively finds the evaluation of the function.
 * This version implements minimax with alpha beta pruning and basic move sorting.
 *
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {boolean[4]} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {Map} prevPositions - a map of the previous positions
 * @param {bigint} prevHash - the hash of the position before moves are simulated.
 * @param {depth} currentDepth - the current depth of the search
 * @param {depth} maxDepth - the maximum depth of the search
 * @param {number} alpha - the alpha value for alpha-beta pruning
 * @param {number} beta - the beta value for alpha-beta pruning
 * @returns {{score: number, move: object}} evaluation of the move and the move
 */
export const minimax2 = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  prevPositions,
  prevHash,
  currentDepth,
  maxDepth,
  alpha,
  beta
) => {
  const opponent = player === WHITE ? BLACK : WHITE;
  const gameOver = checkGameOver(
    bitboards,
    opponent,
    prevPositions,
    enPassantSquare,
    0
  );

  if (gameOver.isGameOver) {
    return {
      score: evaluate2(opponent, gameOver.result, currentDepth),
      move: null,
    };
  }

  if (currentDepth >= maxDepth) {
    // Extends search by one if player is in check
    if (!isInCheck(bitboards, player) || currentDepth !== maxDepth) {
      return {
        score: evaluate2(player, gameOver.result, currentDepth),
        move: null,
      };
    }
  }

  // Gets the legal moves then assigns them scored
  const scored = getAllLegalMoves(
    bitboards,
    player,
    castlingRights,
    enPassantSquare
  ).map((move) => {
    let score = 0;

    // 1) Captures (MVV/LVA: victim value minus your piece value)
    if (move.captured) {
      score +=
        (WEIGHTS[move.captured % 6] || 0) - (WEIGHTS[move.piece % 6] || 0);
    }

    return { move, score };
  });

  // If the game is over, it would have been caught by terminal check
  if (scored.length === 0) {
    throw new Error("Issue with move generation. No moves generated");
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);
  const orderedMoves = scored.map((o) => o.move);

  let bestEval = -Infinity;
  let bestMove = null;

  for (const move of orderedMoves) {
    makeMove(bitboards, move);

    const from = move.from;

    // New game states
    const newEnPassant = getNewEnPassant(move);
    const newCastling = updateCastlingRights(from, move.to, castlingRights);
    const newPositions = new Map(prevPositions);

    // Update Hash
    const newEpFile = newEnPassant ? newEnPassant % 8 : -1;
    const prevEpFile = enPassantSquare ? enPassantSquare % 8 : -1;
    const castlingChanged = new Array(newCastling.length);
    for (let i = 0; i < newCastling.length; i++) {
      if (castlingRights[i] !== newCastling[i]) {
        castlingChanged[i] = true;
      } else {
        castlingChanged[i] = false;
      }
    }
    const hash = updateHash(
      prevHash,
      move,
      newEpFile,
      prevEpFile,
      castlingChanged
    );
    newPositions.set(hash, (newPositions.get(hash) || 0) + 1);

    const { score: moveEval } = minimax2(
      bitboards,
      opponent,
      newCastling,
      newEnPassant,
      newPositions,
      hash,
      currentDepth + 1,
      maxDepth,
      -beta,
      -alpha
    );

    unMakeMove(move, bitboards);

    const score = -moveEval;
    if (score > bestEval) {
      bestEval = moveEval;
      bestMove = move;
    }
    if (score > alpha) {
      alpha = score;
    }

    if (beta <= alpha) {
      break;
    }
  }

  return { score: bestEval, move: bestMove };
};
