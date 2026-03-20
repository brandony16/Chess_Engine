import { squareBB } from "../bb.ts";
import { NO_PIECE, WHITE_PAWN } from "../chessConstants.ts";
import type { Position } from "../Position.ts";
import { makeCastleMove, unMakeCastleMove } from "./castling.ts";
import {
  isCastling,
  isEnPassant,
  moveCaptured,
  moveFrom,
  movePiece,
  movePromotion,
  moveTo,
  type Move,
} from "./move.ts";

/**
 * Makes a move.
 */
export const applyMove = (position: Position, move: Move) => {
  const bbsHi = position.bbsHi;
  const bbsLo = position.bbsLo;
  const pieceAt = position.pieceAt;

  const from = moveFrom(move);
  const to = moveTo(move);

  const [maskFromLo, maskFromHi] = squareBB(from);
  const [maskToLo, maskToHi] = squareBB(to);

  const piece = movePiece(move);
  const captured = moveCaptured(move);
  const promotion = movePromotion(move);
  const enPassant = isEnPassant(move);

  // Handle castle case
  if (isCastling(move)) {
    makeCastleMove(position, move);
    return;
  }

  // Remove moving piece
  bbsLo[piece] &= ~maskFromLo;
  bbsHi[piece] &= ~maskFromHi;

  // Remove captured piece
  if (captured !== NO_PIECE && !enPassant) {
    bbsLo[captured] &= ~maskToLo;
    bbsHi[captured] &= ~maskToHi;
  }

  pieceAt[from] = NO_PIECE;

  // Handles promotions
  if (promotion !== NO_PIECE) {
    bbsLo[promotion] |= maskToLo;
    bbsHi[promotion] |= maskToHi;

    pieceAt[to] = promotion;
  } else {
    bbsLo[piece] |= maskToLo;
    bbsHi[piece] |= maskToHi;

    pieceAt[to] = piece;
  }

  if (enPassant) {
    const dir = piece === WHITE_PAWN ? -8 : 8;
    // Remove the captured pawn from the opposing pawn bitboard
    const [lo, hi] = squareBB(to + dir);
    bbsLo[captured] &= ~lo;
    bbsHi[captured] &= ~hi;

    pieceAt[to + dir] = NO_PIECE;
  }
};

/**
 * Undoes a move that was made. Directly alters given bitboards.
 */
export const unapplyMove = (position: Position, move: Move) => {
  const bbsHi = position.bbsHi;
  const bbsLo = position.bbsLo;
  const pieceAt = position.pieceAt;

  const from = moveFrom(move);
  const to = moveTo(move);

  const [maskFromLo, maskFromHi] = squareBB(from);
  const [maskToLo, maskToHi] = squareBB(to);

  const piece = movePiece(move);
  const captured = moveCaptured(move);
  const promotion = movePromotion(move);
  const enPassant = isEnPassant(move);

  // Undo castle
  if (isCastling(move)) {
    unMakeCastleMove(position, move);
    return;
  }

  pieceAt[to] = NO_PIECE;
  pieceAt[from] = piece;

  // Undo promotion
  if (promotion !== NO_PIECE) {
    bbsLo[promotion] &= ~maskToLo;
    bbsHi[promotion] &= ~maskToHi;
  } else {
    bbsLo[piece] &= ~maskToLo;
    bbsHi[piece] &= ~maskToHi;
  }

  // Place piece back at from
  bbsLo[piece] |= maskFromLo;
  bbsHi[piece] |= maskFromHi;

  // Restore captured piece
  if (captured !== NO_PIECE && !enPassant) {
    bbsLo[captured] |= maskToLo;
    bbsHi[captured] |= maskToHi;

    pieceAt[to] = captured;
  }

  // Undo en passant capture
  if (enPassant) {
    const dir = piece === WHITE_PAWN ? -8 : 8;
    const capturedPawnSquare = to + dir;

    const [lo, hi] = squareBB(capturedPawnSquare);
    bbsLo[captured] |= lo;
    bbsHi[captured] |= hi;

    pieceAt[capturedPawnSquare] = captured;
  }
};
