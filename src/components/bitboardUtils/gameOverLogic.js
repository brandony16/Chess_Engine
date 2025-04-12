/**
 * @typedef {object} Bitboards
 * @property {bigint} whitePawns - bitboard of the white pawns
 * @property {bigint} whiteKnights - bitboard of the white knights
 * @property {bigint} whiteBishops - bitboard of the white bishops
 * @property {bigint} whiteRooks - bitboard of the white rooks
 * @property {bigint} whiteQueens - bitboard of the white queens
 * @property {bigint} whiteKings - bitboard of the white king
 * @property {bigint} blackPawns - bitboard of the black pawns
 * @property {bigint} blackKnights - bitboard of the black knights
 * @property {bigint} blackBishops - bitboard of the black bishops
 * @property {bigint} blackRooks - bitboard of the black rooks
 * @property {bigint} blackQueens - bitboard of the black queens
 * @property {bigint} blackKings - bitboard of the black king
 */

import { isSquareAttacked } from "./bbChessLogic";
import { bitScanForward, getNumPieces } from "./bbUtils";
import { getAllLegalMoves } from "./moveGeneration/allMoveGeneration";
import { getBlackPieces, getWhitePieces } from "./pieceGetters";

/**
 * @typedef {object} CastlingRights
 * @property {boolean} whiteKingside - Whether castling kingside is legal for white
 * @property {boolean} whiteQueenside - Whether castling queenside is legal for white
 * @property {boolean} blackKingside - Whether castling kingside is legal for black
 * @property {boolean} blackQueenside - Whether castling queenside is legal for black
 */

/**
 * Determines if the game is over. Checks for checkmate, stalemate, threefold repetition, draw by insufficient material, and draw by 50 move rule.
 * @param {Bitboards} bitboards - the current positions bitboards
 * @param {string} player - player who would win if it was mate ("w" or "b")
 * @param {Map} pastPositions - the map of past positions stored as hashes.
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where enPassant can occur
 * @param {bigint} attackHash - the attack hash for the player
 * @returns {{ isGameOver: boolean, result: string}} An object with fields for isGameOver and result
 */
export const checkGameOver = (
  bitboards,
  player,
  pastPositions,
  castlingRights,
  enPassantSquare,
  attackHash = null
) => {
  const isPlayerWhite = player === "w";
  const opponent = isPlayerWhite ? "b" : "w";

  const allLegalMoves = getAllLegalMoves(
    bitboards,
    opponent,
    castlingRights,
    enPassantSquare
  );

  const kingBB = bitboards[isPlayerWhite ? "blackKings" : "whiteKings"];
  const kingSquare = bitScanForward(kingBB);

  const result = { isGameOver: false, result: null };

  if (drawByInsufficientMaterial(bitboards)) {
    result.isGameOver = true;
    result.result = "Draw by Insufficient Material";
    return result;
  }
  if (drawByFiftyMoveRule(bitboards, pastPositions)) {
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
  if (allLegalMoves === 0n) {
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
 * Determines if the game is a draw because neither side has sufficient checkmating material. Only insufficient if both sides only have 1 or 0 minor pieces (knight and bishop).
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @returns {boolean} if it is a draw by insufficient material
 */
export const drawByInsufficientMaterial = (bitboards) => {
  const whitePieces = getWhitePieces(bitboards);
  const blackPieces = getBlackPieces(bitboards);

  const queens = bitboards.whiteQueens | bitboards.blackQueens;
  const rooks = bitboards.whiteRooks | bitboards.blackRooks;
  const pawns = bitboards.whitePawns | bitboards.blackPawns;
  const queensRooksPawns = queens | rooks | pawns;

  if (queensRooksPawns !== 0n) {
    return false;
  } else if (getNumPieces(whitePieces) <= 2 && getNumPieces(blackPieces) <= 2) {
    return true;
  }

  return false;
};

/**
 * Determines if the same position has been repeated three times. If so the game is a draw. Note: The positon is NOT the same if the pieces
 * are the same and whose move it is is different. It is also not the same if en Passant was legal, and is no longer legal
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
 * STILL IN PROGRESS. NEED TO ACTUALLY IMPLEMENT.
 *
 * Determines if the game should end by the 50 move rule. The fifty rule move is if there is no capture or pawn move for 50 moves then the
 * game is a draw. A move is each player moving once, so 100 ply.
 * @param {Array} pastPositions - an array of the past positions
 * @returns {boolean} if is a draw by the 50 move rule
 */
export const drawByFiftyMoveRule = (pastPositions) => {
  return false;
};

/**
 * Sorts a given array of moves so that captures are at the front of the array.
 * @param {Array} moves - an array of all the moves. Each move should be an object with an isCapture field.
 * @returns {Array} the sorted moves.
 */
export const sortMoves = (moves) => {
  return moves.sort((a, b) => b.isCapture - a.isCapture);
};
