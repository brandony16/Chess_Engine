import * as C from "../constants.mjs";

export function isPawn(piece) {
  return piece === C.WHITE_PAWN || piece === C.BLACK_PAWN;
}

export function isKnight(piece) {
  return piece === C.WHITE_KNIGHT || piece === C.BLACK_KNIGHT;
}

export function isBishop(piece) {
  return piece === C.WHITE_BISHOP || piece === C.BLACK_BISHOP;
}

export function isRook(piece) {
  return piece === C.WHITE_ROOK || piece === C.BLACK_ROOK;
}

export function isQueen(piece) {
  return piece === C.WHITE_QUEEN || piece === C.BLACK_QUEEN;
}

export function isKing(piece) {
  return piece === C.WHITE_KING || piece === C.BLACK_KING;
}
