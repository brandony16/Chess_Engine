import { kingMasksHi, kingMasksLo } from "../attackMasks/kingMasks.ts";
import type { Bitboard } from "../bb.ts";
import type { Square } from "../chessConstants.ts";
import type { Position } from "../Position.ts";

/**
 * Gets the move bitboard for a king.
 */
export const kingMoves = (pos: Position, from: Square): Bitboard => {
  const side = pos.sideToMove;
  const movesLo = kingMasksLo[from] & ~pos.playerOccLo[side];
  const movesHi = kingMasksHi[from] & ~pos.playerOccHi[side];

  return [movesLo, movesHi];
};

export const castlingMoves = (pos: Position, from: Square): Bitboard => {
  // const rights = pos.castlingRights;
  // if (rights !== 0) {
  //   if (isWhite) {
  //     if (
  //       rights & WK &&
  //       isKingsideCastleLegal(pos.sideToMove, oppAttackMask, occ)
  //     ) {
  //       moves |= 1n << 6n;
  //     }
  //     if (
  //       rights & WQ &&
  //       isQueensideCastleLegal(pos.sideToMove, oppAttackMask, occ)
  //     ) {
  //       moves |= 1n << 2n;
  //     }
  //   } else {
  //     if (
  //       rights & BK &&
  //       isKingsideCastleLegal(pos.sideToMove, oppAttackMask, occ)
  //     ) {
  //       moves |= 1n << 62n;
  //     }
  //     if (
  //       rights & BQ &&
  //       isQueensideCastleLegal(pos.sideToMove, oppAttackMask, occ)
  //     ) {
  //       moves |= 1n << 58n;
  //     }
  //   }
  // }
  return [0, 0];
};
