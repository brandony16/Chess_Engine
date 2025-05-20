import { getNewEnPassant } from "../../bitboardUtils/bbChessLogic";
import { BLACK, WEIGHTS, WHITE } from "../../bitboardUtils/constants";
import { checkGameOver } from "../../bitboardUtils/gameOverLogic";
import { getQuiescenceMoves } from "../../bitboardUtils/moveGeneration/quiescenceMoves/quiescenceMoves";
import { updateCastlingRights } from "../../bitboardUtils/moveMaking/castleMoveLogic";
import {
  makeMove,
  unMakeMove,
} from "../../bitboardUtils/moveMaking/makeMoveLogic";
import { getPieceAtSquare } from "../../bitboardUtils/pieceGetters";
import { updateAttackMasks } from "../../bitboardUtils/PieceMasks/attackMask";
import { updateHash } from "../../bitboardUtils/zobristHashing";
import { evaluate4 } from "./evaluation4";

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
 * @param {CastlingRights} castlingRights - the castling rights
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
  prevHash
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

  // Beta cutoff
  if (standPat >= beta) {
    return { score: beta, move: null };
  }
  alpha = Math.max(alpha, standPat);

  // Generates only capture and promotion moves
  const captures = getQuiescenceMoves(bitboards, player, enPassantSquare);

  // Sort by MVV/LVA
  captures.sort((a, b) => {
    const vA =
      (WEIGHTS[getPieceAtSquare(a.to, bitboards)] || 0) -
      (WEIGHTS[a.captured] || 0);
    const vB =
      (WEIGHTS[getPieceAtSquare(b.to, bitboards)] || 0) -
      (WEIGHTS[b.captured] || 0);
    return vB - vA;
  });

  const opponent = player === WHITE ? BLACK : WHITE;
  for (const move of captures) {
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
    const castlingChanged = {
      whiteKingside: castlingRights.whiteKingside !== newCastling.whiteKingside,
      whiteQueenside:
        castlingRights.whiteQueenside !== newCastling.whiteQueenside,
      blackKingside: castlingRights.blackKingside !== newCastling.blackKingside,
      blackQueenside:
        castlingRights.blackQueenside !== newCastling.blackQueenside,
    };
    const newHash = updateHash(
      prevHash,
      move,
      newEpFile,
      prevEpFile,
      castlingChanged
    );
    const newPositions = new Map(prevPositions);
    newPositions.set(newHash, (newPositions.get(newHash) || 0) + 1);

    const { score: scoreAfterCapture } = quiesce(
      bitboards,
      opponent,
      -beta,
      -alpha,
      newEnPassant,
      newCastling,
      newPositions,
      newHash
    );

    unMakeMove(move, bitboards);

    const score = -scoreAfterCapture;
    if (score >= beta) {
      return { score: beta, move: null };
    }
    if (score > alpha) {
      alpha = score;
    }
  }

  return { score: alpha, move: null };
};
