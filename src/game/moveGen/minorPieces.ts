import {
  BP_START_ROW,
  NO_SQUARE,
  WHITE,
  WP_START_ROW,
} from "../chessConstants.ts";
import type { Position } from "../Position.ts";
import { knightMasks } from "../positionStates/attackMasks/knightMasks.ts";
import {
  blackPawnMasks,
  whitePawnMasks,
} from "../positionStates/attackMasks/pawnMasks.ts";
import type { Square } from "../types.ts";
import { bishopAttacks } from "./sliderMoves.ts";

/**
 * Gets the move bitboard for a pawn.
 */
export const pawnMoves = (pos: Position, from: Square) => {
  const pawnMask = 1n << BigInt(from);

  const isWhite = pos.sideToMove === WHITE;
  const emptySquares = getEmptySquares(bitboards);
  const enemyPieces = isWhite ? pos.occupiedBlack : pos.occupiedWhite;

  let singlePush = 0n;
  let doublePush = 0n;
  let capture = 0n;
  let enPassantCapture = 0n;

  if (isWhite) {
    singlePush = (pawnMask << 8n) & emptySquares;
    doublePush =
      ((pawnMask & WP_START_ROW) << 16n) & emptySquares & (emptySquares << 8n);
    capture = whitePawnMasks[from] & enemyPieces;

    // En Passant for white
    if (pos.enPassantSquare !== NO_SQUARE) {
      const epMask = 1n << BigInt(pos.enPassantSquare);
      enPassantCapture = whitePawnMasks[from] & epMask;
    }
  } else {
    singlePush = (pawnMask >> 8n) & emptySquares;
    doublePush =
      ((pawnMask & BP_START_ROW) >> 16n) & emptySquares & (emptySquares >> 8n);
    capture = blackPawnMasks[from] & enemyPieces;

    // En Passant for black
    if (pos.enPassantSquare !== null) {
      const epMask = 1n << BigInt(pos.enPassantSquare);
      enPassantCapture = blackPawnMasks[from] & epMask;
    }
  }

  return singlePush | doublePush | capture | enPassantCapture;
};

/**
 * Gets the move bitboard for a knight.
 */
export const knightMoves = (pos: Position, from: Square) => {
  const moves = knightMasks[from];
  const friendlyPieces =
    pos.sideToMove === WHITE ? pos.occupiedWhite : pos.occupiedBlack;

  // Remove moves that land on friendly pieces
  return moves & ~friendlyPieces;
};

export const bishopMoves = (pos: Position, from: Square) => {
  // Get occupied squares
  const moves = bishopAttacks(from, pos.occupied);
  const friendlyPieces =
    pos.sideToMove === WHITE ? pos.occupiedWhite : pos.occupiedBlack;

  return moves & ~friendlyPieces;
};
