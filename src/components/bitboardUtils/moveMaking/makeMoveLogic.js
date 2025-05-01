import { filterIllegalMoves } from "../bbChessLogic";
import { GENERAL_SYMBOLS, NUM_PIECES } from "../constants";
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
 * @param {BigUint64Array} bitboards - bitboards of the current position
 * @param {number} from - square to move from
 * @param {number} to - square to move to
 * @param {number} enPassantSquare - square where en passant is legal
 * @param {int} promotionPiece - piece the move promotes to
 * @param {bigint} attackHash - the attack hash for the player
 * @returns {MoveResult}
 */
export const makeMove = (
  bitboards,
  from,
  to,
  enPassantSquare = null,
  promotionPiece = null,
  attackHash = null
) => {
  let updatedBitboards = [...bitboards];

  const bigIntFrom = BigInt(from);
  const bigIntTo = BigInt(to);
  const one = 1n;
  const maskFrom = one << bigIntFrom;
  const maskTo = one << bigIntTo;

  // Handle castle case
  const pieceAtFrom = getPieceAtSquare(from, bitboards);
  if ((pieceAtFrom === 5 || pieceAtFrom === 11) && Math.abs(to - from) === 2) {
    return makeCastleMove(bitboards, from, to, attackHash);
  }

  // Find which piece is at 'from' square
  let movingPiece = null;

  for (let piece = 0; piece < NUM_PIECES; piece++) {
    const bitboard = bitboards[piece];
    if ((bitboard & maskFrom) !== 0n) {
      movingPiece = piece;
      updatedBitboards[piece] &= ~(one << bigIntFrom); // Remove moving piece
      break;
    }
  }

  if (movingPiece === null) throw new Error("No piece found for move");

  // Check if a piece exists at 'to' (capture)
  let isCapture = false;
  for (let piece = 0; piece < NUM_PIECES; piece++) {
    const bitboard = updatedBitboards[piece];
    if ((bitboard & maskTo) !== 0n) {
      updatedBitboards[piece] &= ~maskTo; // Remove captured piece
      isCapture = true;
      break;
    }
  }

  // Handles promotions
  if (promotionPiece) {
    updatedBitboards[promotionPiece] |= one << bigIntTo; // Add promoted piece
    return {
      bitboards: updatedBitboards,
      enPassantSquare: null,
      isCapture: isCapture,
    };
  }

  // Move piece to 'to' square
  updatedBitboards[movingPiece] |= maskTo;

  // Handle En Passant
  const isPawn = movingPiece === 0 || movingPiece === 6;
  let newEnPassantSquare = null;
  if (isPawn) {
    const isPlayerWhite = movingPiece === 0;
    const dir = isPlayerWhite ? -8 : 8;
    if (Math.abs(to - from) === 16) {
      newEnPassantSquare = to + dir;
    }
    if (to === enPassantSquare) {
      // Remove the captured pawn from the opposing pawn bitboard
      updatedBitboards[isPlayerWhite ? 6 : 0] &= ~(one << BigInt(to + dir));
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
 * @param {BigUint64Array} bitboards - bitboards of the current position
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

  // Dont care about color, so if piece is bigger than 5, subtract 6 as that is how
  // many distinct pieces each side has
  const formattedPiece = piece > 5 ? piece - 6 : piece;

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
