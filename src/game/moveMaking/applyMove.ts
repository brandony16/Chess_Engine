import { NO_PIECE, WHITE_PAWN } from "../chessConstants.ts";
import type { Position } from "../Position.ts";
import { makeCastleMove, unMakeCastleMove } from "./castling.ts";
import Move from "./move.ts";

/**
 * Makes a move. Directly alters the given bitboards.
 */
export const applyMove = (position: Position, move: Move) => {
  const bitboards = position.bitboards;
  const pieceAt = position.pieceAt;

  const one = 1n;
  const maskFrom = one << BigInt(move.from);
  const maskTo = one << BigInt(move.to);

  const piece = move.piece;
  const captured = move.captured;
  const promotion = move.promotion;
  const enPassant = move.enPassant;

  // Handle castle case
  if (move.castling) {
    makeCastleMove(position, move);
    return;
  }

  // Remove moving piece
  bitboards[piece] &= ~maskFrom;

  // Remove captured piece
  if (move.captured !== NO_PIECE && !enPassant) {
    bitboards[captured] &= ~maskTo;
  }

  pieceAt[move.from] = NO_PIECE;

  // Handles promotions
  if (promotion !== NO_PIECE) {
    bitboards[promotion] |= maskTo; // Add promoted piece
    pieceAt[move.to] = promotion;
  } else {
    bitboards[piece] |= maskTo;
    pieceAt[move.to] = piece;
  }

  if (enPassant) {
    const dir = piece === WHITE_PAWN ? -8 : 8;
    // Remove the captured pawn from the opposing pawn bitboard
    bitboards[captured] &= ~(one << BigInt(move.to + dir));

    pieceAt[move.to + dir] = NO_PIECE;
  }
};

/**
 * Undoes a move that was made. Directly alters given bitboards.
 */
export const unapplyMove = (position: Position, move: Move) => {
  const bitboards = position.bitboards;
  const pieceAt = position.pieceAt;

  const from = move.from;
  const to = move.to;

  const maskFrom = 1n << BigInt(from);
  const maskTo = 1n << BigInt(to);

  const piece = move.piece;
  const captured = move.captured;
  const promotion = move.promotion;
  const enPassant = move.enPassant;

  // Undo castle
  if (move.castling) {
    unMakeCastleMove(position, move);
    return;
  }

  pieceAt[to] = NO_PIECE;
  pieceAt[from] = piece;

  // Undo promotion
  if (promotion !== NO_PIECE) {
    bitboards[promotion] &= ~maskTo;
    bitboards[piece] |= maskFrom;
  } else {
    bitboards[piece] &= ~maskTo;
    bitboards[piece] |= maskFrom;
  }

  // Restore captured piece
  if (captured !== NO_PIECE && !enPassant) {
    bitboards[captured] |= maskTo;
    pieceAt[to] = captured;
  }

  // Undo en passant capture
  if (enPassant) {
    const dir = piece === WHITE_PAWN ? -8 : 8;
    const capturedPawnSquare = to + dir;
    bitboards[captured] |= 1n << BigInt(capturedPawnSquare);
    pieceAt[capturedPawnSquare] = captured;
  }
};
