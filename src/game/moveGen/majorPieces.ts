import { bishopAttacks, rookAttacks } from "./sliderMoves.ts";
import type { Position } from "../Position.ts";
import { BK, BLACK, BQ, WHITE, WK, WQ } from "../chessConstants.ts";
import type { Square } from "../types.ts";
import { kingMasks } from "../positionStates/attackMasks/kingMasks.ts";
import {
  isKingsideCastleLegal,
  isQueensideCastleLegal,
} from "../moveMaking/castling.ts";

/**
 * Gets all legal rook moves for a given square
 */
export const rookMoves = (pos: Position, from: Square): bigint => {
  const occ = pos.occupied;
  let moves = rookAttacks(from, occ);

  const friendlyOcc =
    pos.sideToMove === WHITE ? pos.occupiedWhite : pos.occupiedBlack;

  return moves & ~friendlyOcc;
};

/**
 * Gets all legal queen moves for a square
 */
export const queenMoves = (pos: Position, from: Square) => {
  const occ = pos.occupied;
  let moves = bishopAttacks(from, occ) | rookAttacks(from, occ);

  const friendlyOcc =
    pos.sideToMove === WHITE ? pos.occupiedWhite : pos.occupiedBlack;

  return moves & ~friendlyOcc;
};

/**
 * Gets the move bitboard for a king.
 */
export const kingMoves = (pos: Position, from: Square) => {
  const isWhite = pos.sideToMove === WHITE;
  const friendlyOcc = isWhite ? pos.occupiedWhite : pos.occupiedBlack;
  let moves = kingMasks[from] & ~friendlyOcc;

  const occ = pos.occupied;
  const oppAttackMask = pos.getAttackMask(isWhite ? BLACK : WHITE);

  /* CASTLING */
  const rights = pos.castlingRights;
  if (rights !== 0) {
    if (isWhite) {
      if (
        rights & WK &&
        isKingsideCastleLegal(pos.sideToMove, oppAttackMask, occ)
      ) {
        moves |= 1n << 6n;
      }
      if (
        rights & WQ &&
        isQueensideCastleLegal(pos.sideToMove, oppAttackMask, occ)
      ) {
        moves |= 1n << 2n;
      }
    } else {
      if (
        rights & BK &&
        isKingsideCastleLegal(pos.sideToMove, oppAttackMask, occ)
      ) {
        moves |= 1n << 62n;
      }
      if (
        rights & BQ &&
        isQueensideCastleLegal(pos.sideToMove, oppAttackMask, occ)
      ) {
        moves |= 1n << 58n;
      }
    }
  }

  // Remove squares attacked by the enemy
  return moves & ~oppAttackMask;
};
