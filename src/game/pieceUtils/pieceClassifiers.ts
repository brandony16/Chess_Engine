import {
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  NO_PIECE,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
  type Piece,
} from "../chessConstants.ts";

export function isPawn(piece: Piece): boolean {
  return piece === WHITE_PAWN || piece === BLACK_PAWN;
}

export function isKnight(piece: Piece): boolean {
  return piece === WHITE_KNIGHT || piece === BLACK_KNIGHT;
}

export function isBishop(piece: Piece): boolean {
  return piece === WHITE_BISHOP || piece === BLACK_BISHOP;
}

export function isRook(piece: Piece): boolean {
  return piece === WHITE_ROOK || piece === BLACK_ROOK;
}

export function isQueen(piece: Piece): boolean {
  return piece === WHITE_QUEEN || piece === BLACK_QUEEN;
}

export function isKing(piece: Piece): boolean {
  return piece === WHITE_KING || piece === BLACK_KING;
}

export function isWhite(piece: Piece): boolean {
  return piece <= WHITE_KING && piece !== NO_PIECE;
}
