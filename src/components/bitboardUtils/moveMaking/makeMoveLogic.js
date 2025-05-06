import { filterIllegalMoves } from "../bbChessLogic";
import { isKing } from "../bbUtils";
import { BLACK_PAWN, WHITE_PAWN } from "../constants";
import { getPieceMoves } from "../moveGeneration/allMoveGeneration";
import { getPieceAtSquare, isPlayersPieceAtSquare } from "../pieceGetters";
import { unMakeCastleMove, updatedMakeCastleMove } from "./castleMoveLogic";
import Move from "./move";

/**
 * @typedef {object} CastlingRights
 * @property {boolean} whiteKingside - Whether castling kingside is legal for white
 * @property {boolean} whiteQueenside - Whether castling queenside is legal for white
 * @property {boolean} blackKingside - Whether castling kingside is legal for black
 * @property {boolean} blackQueenside - Whether castling queenside is legal for black
 */

/**
 *
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {Move} move - a move object
 */
export const updatedMakeMove = (bitboards, move) => {
  const one = 1n;
  const maskFrom = one << BigInt(move.from);
  const maskTo = one << BigInt(move.to);

  const piece = move.piece;
  const captured = move.captured;
  const promotion = move.promotion;
  const enPassant = move.enPassant;

  // Handle castle case
  if (move.castling) {
    updatedMakeCastleMove(bitboards, move.from, move.to);
    return;
  }

  // Remove moving piece
  bitboards[piece] &= ~maskFrom;

  // Remove captured piece
  if (move.captured !== null) {
    bitboards[captured] &= ~maskTo;
  }

  // Handles promotions
  if (promotion) {
    bitboards[promotion] |= maskTo; // Add promoted piece
  } else {
    bitboards[piece] |= maskTo;
  }

  if (enPassant) {
    const dir = piece === WHITE_PAWN ? -8 : 8;
    // Remove the captured pawn from the opposing pawn bitboard
    bitboards[captured] &= ~(one << BigInt(move.to + dir));
  }
};

export const unMakeMove = (move, bitboards) => {
  const from = move.from;
  const to = move.to;

  const one = 1n;
  const maskFrom = one << BigInt(from);
  const maskTo = one << BigInt(to);

  const piece = move.piece;
  const captured = move.captured;
  const promotion = move.promotion;
  const enPassant = move.enPassant;

  // Undo castle
  if (move.castling) {
    unMakeCastleMove(bitboards, from, to);
    return;
  }

  // Undo promotion
  if (promotion) {
    bitboards[promotion] &= ~maskTo;
    bitboards[piece] |= maskFrom;
  } else {
    bitboards[piece] &= ~maskTo;
    bitboards[piece] |= maskFrom;
  }

  // Restore captured piece
  if (captured !== null && !enPassant) {
    bitboards[captured] |= one << BigInt(to);
  }

  // Undo en passant capture
  if (enPassant) {
    const dir = piece === WHITE_PAWN ? -8 : 8;
    const capturedPawnSquare = to + dir;
    bitboards[captured] |= one << BigInt(capturedPawnSquare);
  }
};

/**
 * Determines whether a given move is legal.
 *
 * @param {BigUint64Array} bitboards - bitboards of the current position
 * @param {number} from - the square to move from
 * @param {number} to - the square to move to
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
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
  const formattedPiece = piece % 6;

  const pieceMoves = getPieceMoves(
    bitboards,
    formattedPiece,
    from,
    player,
    enPassantSquare,
    castlingRights
  );
  const legalMoves = filterIllegalMoves(bitboards, pieceMoves, from, player);

  for (const move of legalMoves) {
    if (move.to === to) return true;
  }

  return false;
};

export const getMove = (bitboards, from, to, piece, enPassantSquare) => {
  const isWhite = piece <= 5;
  const castling = isKing(piece) && Math.abs(from - to) === 2;
  const enPassant =
    to === enPassantSquare && (piece === WHITE_PAWN || piece === BLACK_PAWN);
  let captured = getPieceAtSquare(to, bitboards);
  if (enPassant) {
    captured = isWhite ? BLACK_PAWN : WHITE_PAWN;
  }

  const move = new Move(from, to, piece, captured, null, castling, enPassant);
  return move;
};
