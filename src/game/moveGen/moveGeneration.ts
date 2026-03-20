import { Position } from "../Position.ts";
import {
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
  type Piece,
  type Square,
} from "../chessConstants.ts";
import { bishopMoves, knightMoves, pawnMoves } from "./minorPieces.ts";
import { kingMoves, queenMoves, rookMoves } from "./majorPieces.ts";
import type { Bitboard } from "../bb.ts";

/**
 * Gets the moves for a specific piece. Returns a bitboard of the moves for that piece.
 */
export const getPieceMoves = (
  pos: Position,
  piece: Piece,
  sq: Square,
): Bitboard => {
  switch (piece) {
    case WHITE_PAWN:
    case BLACK_PAWN:
      return pawnMoves(pos, sq);
    case WHITE_KNIGHT:
    case BLACK_KNIGHT:
      return knightMoves(pos, sq);
    case WHITE_BISHOP:
    case BLACK_BISHOP:
      return bishopMoves(pos, sq);
    case WHITE_ROOK:
    case BLACK_ROOK:
      return rookMoves(pos, sq);
    case WHITE_QUEEN:
    case BLACK_QUEEN:
      return queenMoves(pos, sq);
    case WHITE_KING:
    case BLACK_KING:
      return kingMoves(pos, sq);
    default:
      return [0, 0]; // No legal moves
  }
};
