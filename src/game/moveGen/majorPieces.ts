import { bishopAttacks, rookAttacks } from "./sliderMoves.ts";
import type { Position } from "../Position.ts";
import { BK, BLACK, BQ, WHITE, WK, WQ } from "../chessConstants.ts";
import type { Square } from "../types.ts";
import { kingMasks } from "../attackMasks/kingMasks.ts";
import {
  isKingsideCastleLegal,
  isQueensideCastleLegal,
} from "../moveMaking/castling.ts";
import { playerAttackMask } from "../attackMasks/attackMasks.ts";
import { opponent } from "../temp.ts";

/**
 * Gets all legal rook moves for a given square
 */
export const rookMoves = (pos: Position, from: Square): bigint => {
  const occ = pos.occupied;
  let moves = rookAttacks(from, occ);

  return moves & ~pos.playerOcc[pos.sideToMove];
};

/**
 * Gets all legal queen moves for a square
 */
export const queenMoves = (pos: Position, from: Square): bigint => {
  const occ = pos.occupied;
  let moves = bishopAttacks(from, occ) | rookAttacks(from, occ);

  return moves & ~pos.playerOcc[pos.sideToMove];
};

/**
 * Gets the move bitboard for a king.
 */
export const kingMoves = (pos: Position, from: Square): bigint => {
  const isWhite = pos.sideToMove === WHITE;
  let moves = kingMasks[from] & ~pos.playerOcc[pos.sideToMove];

  const occ = pos.occupied;
  const oppAttackMask = playerAttackMask(pos, opponent(pos.sideToMove));

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
