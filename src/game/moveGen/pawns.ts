import { getRank } from "../helpers/boardUtils.ts";
import {
  bPMasksHi,
  bPMasksLo,
  wPMasksHi,
  wPMasksLo,
} from "../attackMasks/pawnMasks.ts";
import { opponent } from "../helpers/opponent.ts";
import type { Position } from "../Position.ts";
import {
  BLACK_PAWN,
  NO_PIECE,
  NO_SQUARE,
  PROMO_PIECES,
  PROMO_RANK,
  RANK_2,
  RANK_7,
  WHITE,
  WHITE_PAWN,
  type Square,
} from "../chessConstants.ts";
import {
  bbShiftLeft,
  bbShiftRight,
  lsb,
  squareBB,
  type Bitboard,
} from "../bb.ts";
import { encodeMove, FLAG_DOUBLE } from "../moveMaking/move.ts";

/**
 * Gets the move bitboard for a pawn.
 */
export const pawnMoves = (pos: Position, from: Square): Bitboard => {
  const [pawnLo, pawnHi] = squareBB(from);
  const side = pos.sideToMove;

  const isWhite = side === WHITE;
  const emptyLo = ~pos.occupiedLo;
  const emptyHi = ~pos.occupiedHi;

  const opp = opponent(side);
  const enemyLo = pos.playerOccLo[opp];
  const enemyHi = pos.playerOccHi[opp];

  let singlePushLo = 0,
    singlePushHi = 0;
  let doublePushLo = 0,
    doublePushHi = 0;
  let captureLo = 0,
    captureHi = 0;
  let epCaptureLo = 0,
    epCaptureHi = 0;

  if (isWhite) {
    [singlePushLo, singlePushHi] = bbShiftLeft(pawnLo, pawnHi, 8);
    singlePushLo &= emptyLo;
    singlePushHi &= emptyHi;

    // Double pawn push. Applicable when moving from starting rank and could move 1 square
    if (getRank(from) === RANK_2 && (singlePushLo || singlePushHi)) {
      [doublePushLo, doublePushHi] = bbShiftLeft(pawnLo, pawnHi, 16);
      doublePushLo &= emptyLo;
      doublePushHi &= emptyHi;
    }

    captureLo = wPMasksLo[from] & enemyLo;
    captureHi = wPMasksHi[from] & enemyHi;

    // En Passant for white
    if (pos.enPassantSquare !== NO_SQUARE) {
      const [epMaskLo, epMaskHi] = squareBB(pos.enPassantSquare);
      epCaptureLo = wPMasksLo[from] & epMaskLo;
      epCaptureHi = wPMasksHi[from] & epMaskHi;
    }
  } else {
    [singlePushLo, singlePushHi] = bbShiftRight(pawnLo, pawnHi, 8);
    singlePushLo &= emptyLo;
    singlePushHi &= emptyHi;

    if (getRank(from) === RANK_7 && (singlePushLo || singlePushHi)) {
      [doublePushLo, doublePushHi] = bbShiftRight(pawnLo, pawnHi, 16);
      doublePushLo &= emptyLo;
      doublePushHi &= emptyHi;
    }

    captureLo = bPMasksLo[from] & enemyLo;
    captureHi = bPMasksHi[from] & enemyHi;

    // En Passant for black
    if (pos.enPassantSquare !== NO_SQUARE) {
      const [epMaskLo, epMaskHi] = squareBB(pos.enPassantSquare);
      epCaptureLo = bPMasksLo[from] & epMaskLo;
      epCaptureHi = bPMasksHi[from] & epMaskHi;
    }
  }

  const finalLo = singlePushLo | doublePushLo | captureLo | epCaptureLo;
  const finalHi = singlePushHi | doublePushHi | captureHi | epCaptureHi;
  return [finalLo, finalHi];
};

export const generateSinglePush = (pos: Position, start: number): number => {
  const side = pos.sideToMove;
  const emptyLo = ~pos.occupiedLo;
  const emptyHi = ~pos.occupiedHi;

  let lo = 0,
    hi = 0;
  if (side === WHITE) {
    const pawnLo = pos.bbsLo[WHITE_PAWN],
      pawnHi = pos.bbsHi[WHITE_PAWN];
    [lo, hi] = bbShiftLeft(pawnLo, pawnHi, 8);
    lo &= emptyLo;
    hi &= emptyHi;
  } else {
    const pawnLo = pos.bbsLo[BLACK_PAWN],
      pawnHi = pos.bbsHi[BLACK_PAWN];
    [lo, hi] = bbShiftRight(pawnLo, pawnHi, 8);
    lo &= emptyLo;
    hi &= emptyHi;
  }

  const promoRank = PROMO_RANK[side];
  const promoList = PROMO_PIECES[side];
  const pawn = side === WHITE ? WHITE_PAWN : BLACK_PAWN;

  const buffer = pos.moveBuffer;
  let count = 0;
  while (lo || hi) {
    const to = lsb(lo, hi);
    if (lo) lo &= lo - 1;
    else hi &= hi - 1;

    const from = side == WHITE ? to - 8 : to + 8;

    if (to >> 3 === promoRank) {
      for (let k = 0; k < promoList.length; k++) {
        buffer[start + count++] = encodeMove(
          from,
          to,
          pawn,
          NO_PIECE,
          promoList[k],
          0, // no flags
        );
      }

      continue;
    }

    buffer[start + count++] = encodeMove(
      from,
      to,
      side === WHITE ? WHITE_PAWN : BLACK_PAWN,
      NO_PIECE,
      NO_PIECE,
      0, // no flags
    );
  }

  return count;
};

export const generateDoublePush = (pos: Position, start: number): number => {
  const side = pos.sideToMove;
  const buffer = pos.moveBuffer;

  const RANK4_MASK_LO = 0xff000000; // bits 24-31
  const RANK3_MASK_LO = 0x00ff0000;

  const RANK5_MASK_HI = 0x000000ff; // bits 0-7 of the hi word (squares 32-39)
  const RANK6_MASK_HI = 0x0000ff00;

  let count = 0;
  if (side === WHITE) {
    const emptyLo = ~pos.occupiedLo;

    // Single push into rank 3, then double push into rank 4. All within lo
    const singlePush = (pos.bbsLo[WHITE_PAWN] << 8) & emptyLo & RANK3_MASK_LO;
    let destinations = (singlePush << 8) & emptyLo & RANK4_MASK_LO;
    while (destinations) {
      const to = lsb(destinations, 0);
      destinations &= destinations - 1;
      buffer[start + count++] = encodeMove(
        to - 16,
        to,
        WHITE_PAWN,
        NO_PIECE,
        NO_PIECE,
        FLAG_DOUBLE,
      );
    }
  } else {
    const emptyHi = ~pos.occupiedHi;

    // Single push into rank 6, then double push into rank 6. All within hi
    const singlePush = (pos.bbsHi[BLACK_PAWN] >>> 8) & emptyHi & RANK6_MASK_HI;
    let destinations = (singlePush >>> 8) & emptyHi & RANK5_MASK_HI;

    while (destinations) {
      const to = lsb(0, destinations);
      destinations &= destinations - 1;
      buffer[start + count++] = encodeMove(
        to - 16,
        to,
        WHITE_PAWN,
        NO_PIECE,
        NO_PIECE,
        FLAG_DOUBLE,
      );
    }
  }

  return count;
};
