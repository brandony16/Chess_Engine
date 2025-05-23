import { getNewEnPassant } from "../../bitboardUtils/bbChessLogic";
import { BLACK, WHITE } from "../../bitboardUtils/constants";
import { checkGameOver } from "../../bitboardUtils/gameOverLogic";
import { getQuiescenceMoves } from "../../bitboardUtils/moveGeneration/quiescenceMoves/quiescenceMoves";
import { updateCastlingRights } from "../../bitboardUtils/moveMaking/castleMoveLogic";
import {
  makeMove,
  unMakeMove,
} from "../../bitboardUtils/moveMaking/makeMoveLogic";
import { updateAttackMasks } from "../../bitboardUtils/PieceMasks/attackMask";
import {
  getQTT,
  setQTT,
  TT_FLAG,
} from "../../bitboardUtils/TranspositionTable/transpositionTable";
import { updateHash } from "../../bitboardUtils/zobristHashing";
import { evaluate4, weights } from "./evaluation4";

const maxQDepth = 6;

/**
 * Performs a quiescence search, which calculates lines of captures. Only evaluates moves
 * that are captures or promotions to increase tactical capabilities. Uses negamax, a
 * variation of minimax that serves the same purpose.
 *
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {number} alpha - the alpha value for alpha-beta pruning
 * @param {number} beta - the beta value for alpha-beta pruning
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {Array<boolean>} castlingRights - the castling rights
 * @param {Map} prevPositions - a map of the previous positions
 * @param {bigint} prevHash - the hash of the current position before moves are simulated.
 *
 * @returns {{ score: number, move: null }} - an object with the score and move number
 */
export const quiesce = (
  bitboards,
  player,
  alpha,
  beta,
  enPassantSquare,
  castlingRights,
  prevPositions,
  prevHash,
  depth = 0
) => {
  const gameOver = checkGameOver(
    bitboards,
    player,
    prevPositions,
    enPassantSquare,
    0
  );
  if (gameOver.isGameOver) {
    return {
      score: evaluate4(bitboards, player, gameOver.result, 0),
      move: null,
    };
  }

  // Static evaluation of the position
  const standPat = evaluate4(
    bitboards,
    player,
    /* result */ null,
    /* depth */ 0
  );

  if (depth + 1 > maxQDepth) {
    return { score: standPat, move: null };
  }

  // Beta cutoff
  if (standPat >= beta) {
    return { score: beta, move: null };
  }
  const origAlpha = alpha;
  alpha = Math.max(alpha, standPat);

  const ttEntry = getQTT(prevHash);
  const remaining = maxQDepth - depth;
  if (ttEntry && ttEntry.depth >= remaining && ttEntry.isQuiescence) {
    if (ttEntry.flag === TT_FLAG.EXACT) {
      return { score: ttEntry.value, move: null };
    } else if (ttEntry.flag === TT_FLAG.LOWER_BOUND && ttEntry.value > alpha) {
      alpha = ttEntry.value;
    } else if (ttEntry.flag === TT_FLAG.UPPER_BOUND && ttEntry.value < beta) {
      beta = ttEntry.value;
    }
    if (alpha >= beta) {
      return { score: ttEntry.value, move: null };
    }
  }

  // Generates only capture and promotion moves
  const captures = getQuiescenceMoves(bitboards, player, enPassantSquare);

  // Sort by MVV/LVA
  captures.sort((a, b) => {
    const vA = (weights[a.captured] || 0) - (weights[a.piece] || 0);
    const vB = (weights[b.captured] || 0) - (weights[b.piece] || 0);
    return vB - vA;
  });

  const opponent = player === WHITE ? BLACK : WHITE;
  for (const move of captures) {
    const attackerValue = weights[move.piece] || 0;
    const victimValue = weights[move.captured] || 0;
    const seeGain = victimValue - attackerValue;
    // if even winning the capture can’t push us above alpha, skip it:
    if (standPat + seeGain <= alpha) continue;

    makeMove(bitboards, move);
    updateAttackMasks(bitboards, move);

    const newEnPassant = getNewEnPassant(move);
    const newCastling = updateCastlingRights(
      move.from,
      move.to,
      castlingRights
    );

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
    const newHash = updateHash(
      prevHash,
      move,
      newEpFile,
      prevEpFile,
      castlingChanged
    );
    const oldCount = prevPositions.get(newHash) || 0;
    prevPositions.set(newHash, (prevPositions.get(newHash) || 0) + 1);

    const { score: scoreAfterCapture } = quiesce(
      bitboards,
      opponent,
      -beta,
      -alpha,
      newEnPassant,
      newCastling,
      prevPositions,
      newHash,
      depth + 1
    );

    unMakeMove(move, bitboards);
    updateAttackMasks(bitboards, move);
    if (oldCount) prevPositions.set(newHash, oldCount);
    else prevPositions.delete(newHash);

    const score = -scoreAfterCapture;
    if (score >= beta) {
      return { score: beta, move: null };
    }
    if (score > alpha) {
      alpha = score;
    }
  }

  let flag = TT_FLAG.EXACT;
  if (alpha <= origAlpha) {
    flag = TT_FLAG.UPPER_BOUND;
  } else if (alpha >= beta) {
    flag = TT_FLAG.LOWER_BOUND;
  }
  setQTT(prevHash, {
    value: alpha,
    depth: remaining,
    flag: flag,
    isQuiescence: true,
  });

  return { score: alpha, move: null };
};
