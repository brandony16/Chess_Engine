import { getNewEnPassant } from "../../bitboardUtils/bbChessLogic";
import { BLACK, WEIGHTS, WHITE } from "../../bitboardUtils/constants";
import { checkGameOver } from "../../bitboardUtils/gameOverLogic";
import { getQuiescenceMoves } from "../../bitboardUtils/moveGeneration/quiescenceMoves/quiescenceMoves";
import { updateCastlingRights } from "../../bitboardUtils/moveMaking/castleMoveLogic";
import {
  unMakeMove,
  updatedMakeMove,
} from "../../bitboardUtils/moveMaking/makeMoveLogic";
import { getPieceAtSquare } from "../../bitboardUtils/pieceGetters";
import { updateAttackMaskHash } from "../../bitboardUtils/PieceMasks/attackMask";
import { updateHash } from "../../bitboardUtils/zobristHashing";
import { evaluate3 } from "./evaluation3";

/**
 * Performs a quiescence search, which calculates lines of captures. Only evaluates moves
 * that are captures or promotions to increase tactical capabilities.
 *
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {number} alpha - the alpha value for alpha-beta pruning
 * @param {number} beta - the beta value for alpha-beta pruning
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {Map} prevPositions - a map of the previous positions
 * @param {bigint} prevHash - the hash of the current position before moves are simulated.
 * @param {bigint} prevAttackHash - the attack hash of the current position before moves are simulated.
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
  prevAttackHash
) => {
  const gameOver = checkGameOver(
    bitboards,
    player,
    prevPositions,
    enPassantSquare,
    0,
    prevAttackHash
  );
  if (gameOver.isGameOver) {
    return {
      score: evaluate3(bitboards, player, gameOver.result, 0),
      move: null,
    };
  }

  // Static evaluation of the position
  const standPat = evaluate3(
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
  const captures = getQuiescenceMoves(
    bitboards,
    player,
    enPassantSquare,
    prevAttackHash
  );

  // Sort by MVV/LVA
  captures.sort((a, b) => {
    const vA =
      (WEIGHTS[getPieceAtSquare(a.to, bitboards)] || 0) -
      (WEIGHTS[getPieceAtSquare(a.from, bitboards)] || 0);
    const vB =
      (WEIGHTS[getPieceAtSquare(b.to, bitboards)] || 0) -
      (WEIGHTS[getPieceAtSquare(b.from, bitboards)] || 0);
    return vB - vA;
  });

  const opponent = player === WHITE ? BLACK : WHITE;
  for (const move of captures) {
    updatedMakeMove(bitboards, move);
    const newEnPassant = getNewEnPassant(move);
    const newCastling = updateCastlingRights(move.from, castlingRights);
    const newAttackHash = updateAttackMaskHash(
      bitboards,
      prevAttackHash,
      move,
      player,
      enPassantSquare
    );

    const enPassantChanged = enPassantSquare !== newEnPassant;
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
      enPassantChanged,
      castlingChanged
    );
    const newPositions = new Map(prevPositions);
    newPositions.set(newHash, (newPositions.get(newHash) || 0) + 1);

    const { score: scoreAfterCapture } = quiesce(
      bitboards,
      opponent,
      -beta, // Negamax to condense code
      -alpha,
      newEnPassant,
      newCastling,
      newPositions,
      newHash,
      newAttackHash
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
