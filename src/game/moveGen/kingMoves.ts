import { playerAttackMask } from "../attackMasks/attackMasks.ts";
import { kingMasksHi, kingMasksLo } from "../attackMasks/kingMasks.ts";
import { SQUARE_BB_HI, SQUARE_BB_LO, type Bitboard } from "../bb.ts";
import {
  BK,
  BLACK,
  BQ,
  WHITE,
  WK,
  WQ,
  type Square,
} from "../chessConstants.ts";
import {
  isKingsideCastleLegal,
  isQueensideCastleLegal,
} from "../moveMaking/castling.ts";
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
  let movesLo = 0,
    movesHi = 0;

  const rights = pos.castlingRights;
  if (rights !== 0) {
    const occLo = pos.occupiedLo,
      occHi = pos.occupiedHi;
    if (pos.sideToMove === WHITE && rights & (WK | WQ)) {
      const [attLo, attHi] = playerAttackMask(pos, BLACK);
      if (
        rights & WK &&
        isKingsideCastleLegal(pos.sideToMove, attLo, attHi, occLo, occHi)
      ) {
        const lo = SQUARE_BB_LO[6];
        const hi = SQUARE_BB_HI[6];
        movesLo |= lo;
        movesHi |= hi;
      }
      if (
        rights & WQ &&
        isQueensideCastleLegal(pos.sideToMove, attLo, attHi, occLo, occHi)
      ) {
        const lo = SQUARE_BB_LO[2];
        const hi = SQUARE_BB_HI[2];
        movesLo |= lo;
        movesHi |= hi;
      }
    } else if (pos.sideToMove === BLACK && rights & (BK | BQ)) {
      const [attLo, attHi] = playerAttackMask(pos, WHITE);
      if (
        rights & BK &&
        isKingsideCastleLegal(pos.sideToMove, attLo, attHi, occLo, occHi)
      ) {
        const lo = SQUARE_BB_LO[62];
        const hi = SQUARE_BB_HI[62];
        movesLo |= lo;
        movesHi |= hi;
      }
      if (
        rights & BQ &&
        isQueensideCastleLegal(pos.sideToMove, attLo, attHi, occLo, occHi)
      ) {
        const lo = SQUARE_BB_LO[58];
        const hi = SQUARE_BB_HI[58];
        movesLo |= lo;
        movesHi |= hi;
      }
    }
  }

  return [movesLo, movesHi];
};
