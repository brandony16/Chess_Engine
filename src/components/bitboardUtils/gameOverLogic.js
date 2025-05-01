import { hasLegalMove, isSquareAttacked } from "./bbChessLogic";
import { bitScanForward, getNumPieces } from "./bbUtils";
import {
  BLACK,
  BLACK_KING,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  WHITE,
  WHITE_KING,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "./constants";
import { getBlackPieces, getWhitePieces } from "./pieceGetters";

/**
 * Determines if the game is over. Checks for checkmate, stalemate, threefold repetition,
 * draw by insufficient material, and draw by 50 move rule.
 *
 * @param {BigUint64Array} bitboards - the current positions bitboards
 * @param {number} player - player who would win if it was mate (0 for w, 1 for b)
 * @param {Map} pastPositions - the map of past positions stored as hashes.
 * @param {number} enPassantSquare - the square where enPassant can occur
 * @param {bigint} attackHash - the attack hash for the player
 * @returns {{ isGameOver: boolean, result: string}} An object with fields for isGameOver and result
 */
export const checkGameOver = (
  bitboards,
  player,
  pastPositions,
  enPassantSquare,
  fiftyMoveCounter,
  attackHash = null
) => {
  const isPlayerWhite = player === WHITE;
  const opponent = isPlayerWhite ? BLACK : WHITE;

  const kingBB = bitboards[isPlayerWhite ? BLACK_KING : WHITE_KING];
  const kingSquare = bitScanForward(kingBB);

  const result = { isGameOver: false, result: null };

  if (drawByInsufficientMaterial(bitboards)) {
    result.isGameOver = true;
    result.result = "Draw by Insufficient Material";
    return result;
  }
  if (drawByFiftyMoveRule(fiftyMoveCounter)) {
    result.isGameOver = true;
    result.result = "Draw By 50 Move Rule";
    return result;
  }
  if (drawByRepetition(pastPositions)) {
    result.isGameOver = true;
    result.result = "Draw by Repetition";
    return result;
  }

  // If player has no moves it is stalemate or checkmate
  if (!hasLegalMove(bitboards, opponent, enPassantSquare)) {
    result.isGameOver = true;

    if (isSquareAttacked(bitboards, kingSquare, player, attackHash)) {
      const fullPlayer = isPlayerWhite ? "White" : "Black";

      result.result = `${fullPlayer} Wins by Checkmate`;
      return result;
    }

    result.result = "Draw by Stalemate";
    return result;
  }

  return result;
};

/**
 * Determines if the game is a draw because neither side has sufficient checkmating material.
 * Only insufficient if both sides only have 1 or 0 minor pieces (knight and bishop).
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @returns {boolean} if it is a draw by insufficient material
 */
export const drawByInsufficientMaterial = (bitboards) => {
  const whitePieces = getWhitePieces(bitboards);
  const blackPieces = getBlackPieces(bitboards);

  const queens = bitboards[WHITE_QUEEN] | bitboards[BLACK_QUEEN];
  const rooks = bitboards[WHITE_ROOK] | bitboards[BLACK_ROOK];
  const pawns = bitboards[WHITE_PAWN] | bitboards[BLACK_PAWN];
  const queensRooksPawns = queens | rooks | pawns;

  if (queensRooksPawns !== 0n) {
    return false;
  } else if (getNumPieces(whitePieces) <= 2 && getNumPieces(blackPieces) <= 2) {
    return true;
  }

  return false;
};

/**
 * Determines if the same position has been repeated three times. If so the game is a draw.
 * Note: The positon is NOT the same if the pieces are the same and whose move it is is
 * different. It is also not the same if en Passant was legal, and is no longer legal.
 *
 * @param {Map} pastPositions - The map of the past positions. Stored as hashes
 * @returns {boolean} if it is a threefold repetition
 */
export const drawByRepetition = (pastPositions) => {
  for (let count of pastPositions.values()) {
    if (count >= 3) {
      return true;
    }
  }
  return false;
};

/**
 * Determines if the game should end by the 50 move rule. The fifty rule move is if there
 * is no capture or pawn move for 50 moves then the game is a draw. A move is each player
 * moving once, so 100 ply.
 *
 * @param {number} fiftyMoveCounter - the amount of ply since the last pawn move or capture
 * @returns {boolean} if is a draw by the 50 move rule
 */
export const drawByFiftyMoveRule = (fiftyMoveCounter) => {
  return fiftyMoveCounter >= 100;
};
