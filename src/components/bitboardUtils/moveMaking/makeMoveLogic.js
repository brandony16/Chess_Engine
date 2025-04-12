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

import { filterIllegalMoves } from "../bbChessLogic";
import { GENERAL_SYMBOLS } from "../constants";
import { getPieceMoves } from "../moveGeneration/allMoveGeneration";
import { getPieceAtSquare, isPlayersPieceAtSquare } from "../pieceGetters";
import { makeCastleMove } from "./castleMoveLogic";

/**
 * @typedef {object} CastlingRights
 * @property {boolean} whiteKingside - Whether castling kingside is legal for white
 * @property {boolean} whiteQueenside - Whether castling queenside is legal for white
 * @property {boolean} blackKingside - Whether castling kingside is legal for black
 * @property {boolean} blackQueenside - Whether castling queenside is legal for black
 */

/**
 * @typedef {Object} MoveResult
 * @property {object} bitboards - The updated bitboards after the move
 * @property {number} enPassantSquare - The square where enPassant is legal
 * @property {boolean} isCapture - Whether the move was a capture
 */

/**
 * Makes a move. Does not validate that moves are legal, as that is handled by other functions.
 *
 * @param {Bitboards} bitboards - bitboards of the current position
 * @param {number} from - square to move from
 * @param {number} to - square to move to
 * @param {number} enPassantSquare - square where en passant is legal, if any
 * @param {string} promotionPiece - piece the move promotes to, if any
 * @returns {MoveResult}
 */
export const makeMove = (
  bitboards,
  from,
  to,
  enPassantSquare = null,
  promotionPiece = null
) => {
  let updatedBitboards = { ...bitboards };
  const bigIntFrom = BigInt(from);
  const bigIntTo = BigInt(to);
  const one = 1n;
  const maskFrom = one << bigIntFrom;
  const maskTo = one << bigIntTo;

  // Handle castle case
  const pieceAtFrom = getPieceAtSquare(from, bitboards);
  if (GENERAL_SYMBOLS[pieceAtFrom] === "K" && Math.abs(to - from) === 2) {
    return makeCastleMove(bitboards, from, to);
  }

  // Find which piece is at 'from' square
  let movingPiece = null;
  const pieceKeys = Object.keys(bitboards);
  for (const piece of pieceKeys) {
    const bitboard = bitboards[piece];
    if ((bitboard & maskFrom) !== 0n) {
      movingPiece = piece;
      updatedBitboards[piece] &= ~(one << bigIntFrom);
      break;
    }
  }

  if (!movingPiece) return { bitboards: updatedBitboards };

  // Check if a piece exists at 'to' (capture)
  let isCapture = false;
  for (const piece of pieceKeys) {
    const bitboard = updatedBitboards[piece];
    if ((bitboard & maskTo) !== 0n) {
      updatedBitboards[piece] &= ~maskTo; // Remove captured piece
      isCapture = true;
      break;
    }
  }

  // Handles promotions
  if (promotionPiece) {
    const promotedPieceKey =
      movingPiece.charAt(0) === "w"
        ? `white${promotionPiece}`
        : `black${promotionPiece}`;

    updatedBitboards[promotedPieceKey] |= one << bigIntTo; // Add promoted piece
    return {
      bitboards: updatedBitboards,
      enPassantSquare: null,
      isCapture: isCapture,
    };
  }

  // Move piece to 'to' square
  updatedBitboards[movingPiece] |= maskTo;

  // Handle En Passant
  const piecePrefix = movingPiece.charAt(0);
  const pieceTypeIndicator = movingPiece.charAt(5);
  let newEnPassantSquare = null;
  if (pieceTypeIndicator === "P") {
    const isPlayerWhite = piecePrefix === "w";
    const dir = isPlayerWhite ? -8 : 8;
    if (Math.abs(to - from) === 16) {
      newEnPassantSquare = to + dir;
    }
    if (to === enPassantSquare) {
      // Remove the captured pawn from the opposing pawn bitboard
      updatedBitboards[isPlayerWhite ? "blackPawns" : "whitePawns"] &= ~(
        one << BigInt(to + dir)
      );
    }
  }

  return {
    bitboards: updatedBitboards,
    enPassantSquare: newEnPassantSquare,
    isCapture: isCapture,
  };
};

/**
 * Determines whether a given move is legal.
 *
 * @param {Bitboards} bitboards - bitboards of the current position
 * @param {number} from - the square to move from
 * @param {number} to - the square to move to
 * @param {string} player - the player whose move it is ("w" or "b")
 * @param {number} enPassantSquare
 *                the square where enPassant can happen, if any
 * @param {CastlingRights} castlingRights - the castling rights
 * @returns {boolean} - if the move is legal
 */
export const isValidMove = (
  bitboards,
  from,
  to,
  player,
  enPassantSquare = null,
  castlingRights
) => {
  // If the final square is one of the player's pieces, then it is not valid
  // Cannot capture your own piece
  if (isPlayersPieceAtSquare(player, to, bitboards)) {
    return false;
  }

  // Get the piece type then convert it to 'P', 'N', 'B', 'R', 'Q', or 'K'
  const piece = getPieceAtSquare(from, bitboards);
  if (piece === null) return false;

  const formattedPiece = GENERAL_SYMBOLS[piece];

  const pieceMoves = getPieceMoves(
    bitboards,
    formattedPiece,
    from,
    player,
    enPassantSquare,
    castlingRights
  );
  const legalMoves = filterIllegalMoves(bitboards, pieceMoves, from, player);

  return Boolean((legalMoves >> BigInt(to)) & BigInt(1));
};
