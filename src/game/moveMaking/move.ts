import {
  type CastlingNumber,
  type Piece,
  type Square,
} from "../chessConstants.ts";

/*
bits
0–5   from square
6–11  to square
12–15 moving piece
16–19 captured piece
20–23 promotion piece
24    en passant
25    castling
26    pawn double
27–31 unused
*/
export type Move = number;

export const FROM_SHIFT = 0;
export const TO_SHIFT = 6;
export const PIECE_SHIFT = 12;
export const CAPTURE_SHIFT = 16;
export const PROMO_SHIFT = 20;

export const FLAG_EP = 1 << 24;
export const FLAG_CASTLE = 1 << 25;
export const FLAG_DOUBLE = 1 << 26;

export function encodeMove(
  from: number,
  to: number,
  piece: number,
  captured: number = 0,
  promo: number = 0,
  flags: number = 0,
): Move {
  return (
    from |
    (to << TO_SHIFT) |
    (piece << PIECE_SHIFT) |
    (captured << CAPTURE_SHIFT) |
    (promo << PROMO_SHIFT) |
    flags
  );
}

export const moveFrom = (m: Move): Square => (m & 63) as Square;

export const moveTo = (m: Move): Square => ((m >>> 6) & 63) as Square;

export const movePiece = (m: Move): Piece => ((m >>> 12) & 15) as Piece;

export const moveCaptured = (m: Move): Piece => ((m >>> 16) & 15) as Piece;

export const movePromotion = (m: Move): Piece => ((m >>> 20) & 15) as Piece;

export const isEnPassant = (m: Move) => (m & FLAG_EP) !== 0;

export const isCastling = (m: Move) => (m & FLAG_CASTLE) !== 0;

export const isDouble = (m: Move) => (m & FLAG_DOUBLE) !== 0;
