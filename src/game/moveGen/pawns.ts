import { bPMasksHi, wPMasksLo } from "../attackMasks/pawnMasks.ts";
import type { Position } from "../Position.ts";
import {
  BLACK_PAWN,
  NO_PIECE,
  NO_SQUARE,
  PROMO_PIECES,
  PROMO_RANK,
  WHITE,
  WHITE_PAWN,
} from "../chessConstants.ts";
import { bbShiftLeft, bbShiftRight, lsb } from "../bb.ts";
import { encodeMove, FLAG_DOUBLE, FLAG_EP } from "../moveMaking/move.ts";
import {
  NOT_A_FILE_HI,
  NOT_A_FILE_LO,
  NOT_H_FILE_HI,
  NOT_H_FILE_LO,
  RANK3_MASK_LO,
  RANK4_MASK_LO,
  RANK5_MASK_HI,
  RANK6_MASK_HI,
} from "./rankFileMasks.ts";

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
        to + 16,
        to,
        BLACK_PAWN,
        NO_PIECE,
        NO_PIECE,
        FLAG_DOUBLE,
      );
    }
  }

  return count;
};

export const generateAttackWest = (pos: Position, start: number): number => {
  const side = pos.sideToMove;
  const pawn = side === WHITE ? WHITE_PAWN : BLACK_PAWN;

  const pawnLo = pos.bbsLo[pawn];
  const pawnHi = pos.bbsHi[pawn];
  const maskedLo = pawnLo & NOT_A_FILE_LO;
  const maskedHi = pawnHi & NOT_A_FILE_HI;

  // Only capture enemy pieces
  const enemyLo = pos.playerOccLo[side ^ 1];
  const enemyHi = pos.playerOccHi[side ^ 1];

  const promoRank = PROMO_RANK[side];
  const promoList = PROMO_PIECES[side];
  const buffer = pos.moveBuffer;
  const pieceAt = pos.pieceAt;

  let count = 0;
  if (side === WHITE) {
    let [lo, hi] = bbShiftLeft(maskedLo, maskedHi, 7);
    lo &= enemyLo;
    hi &= enemyHi;

    while (lo || hi) {
      const to = lsb(lo, hi);
      if (lo) lo &= lo - 1;
      else hi &= hi - 1;

      const from = to - 7;
      const captured = pieceAt[to];

      if (to >> 3 === promoRank) {
        for (let k = 0; k < promoList.length; k++) {
          buffer[start + count++] = encodeMove(
            from,
            to,
            pawn,
            captured,
            promoList[k],
            0,
          );
        }
        continue;
      }

      buffer[start + count++] = encodeMove(
        from,
        to,
        pawn,
        captured,
        NO_PIECE,
        0,
      );
    }
  } else {
    let [lo, hi] = bbShiftRight(maskedLo, maskedHi, 9);
    lo &= enemyLo;
    hi &= enemyHi;

    while (lo || hi) {
      const to = lsb(lo, hi);
      if (lo) lo &= lo - 1;
      else hi &= hi - 1;

      const from = to + 9; // black shifts right by 9, so source is 9 ahead
      const captured = pieceAt[to];

      if (to >> 3 === promoRank) {
        for (let k = 0; k < promoList.length; k++) {
          buffer[start + count++] = encodeMove(
            from,
            to,
            pawn,
            captured,
            promoList[k],
            0,
          );
        }
        continue;
      }

      buffer[start + count++] = encodeMove(
        from,
        to,
        pawn,
        captured,
        NO_PIECE,
        0,
      );
    }
  }

  return count;
};

export const generateAttackEast = (pos: Position, start: number): number => {
  const side = pos.sideToMove;
  const pawn = side === WHITE ? WHITE_PAWN : BLACK_PAWN;

  const pawnLo = pos.bbsLo[pawn];
  const pawnHi = pos.bbsHi[pawn];
  const maskedLo = pawnLo & NOT_H_FILE_LO;
  const maskedHi = pawnHi & NOT_H_FILE_HI;

  // Only capture enemy pieces
  const enemyLo = pos.playerOccLo[side ^ 1];
  const enemyHi = pos.playerOccHi[side ^ 1];

  const promoRank = PROMO_RANK[side];
  const promoList = PROMO_PIECES[side];
  const buffer = pos.moveBuffer;
  const pieceAt = pos.pieceAt;

  let count = 0;
  if (side === WHITE) {
    let [lo, hi] = bbShiftLeft(maskedLo, maskedHi, 9);
    lo &= enemyLo;
    hi &= enemyHi;

    while (lo || hi) {
      const to = lsb(lo, hi);
      if (lo) lo &= lo - 1;
      else hi &= hi - 1;

      const from = to - 9;
      const captured = pieceAt[to];

      if (to >> 3 === promoRank) {
        for (let k = 0; k < promoList.length; k++) {
          buffer[start + count++] = encodeMove(
            from,
            to,
            pawn,
            captured,
            promoList[k],
            0,
          );
        }
        continue;
      }

      buffer[start + count++] = encodeMove(
        from,
        to,
        pawn,
        captured,
        NO_PIECE,
        0,
      );
    }
  } else {
    let [lo, hi] = bbShiftRight(maskedLo, maskedHi, 7);
    lo &= enemyLo;
    hi &= enemyHi;

    while (lo || hi) {
      const to = lsb(lo, hi);
      if (lo) lo &= lo - 1;
      else hi &= hi - 1;

      const from = to + 7; // undo shift
      const captured = pieceAt[to];

      if (to >> 3 === promoRank) {
        for (let k = 0; k < promoList.length; k++) {
          buffer[start + count++] = encodeMove(
            from,
            to,
            pawn,
            captured,
            promoList[k],
            0,
          );
        }
        continue;
      }

      buffer[start + count++] = encodeMove(
        from,
        to,
        pawn,
        captured,
        NO_PIECE,
        0,
      );
    }
  }

  return count;
};

export const generateEpMoves = (pos: Position, start: number): number => {
  const epSq = pos.enPassantSquare;
  if (epSq === NO_SQUARE) return 0;

  let count = 0;
  const buffer = pos.moveBuffer;
  if (pos.sideToMove === WHITE) {
    // only need hi as ep square must be on rank 6, so any pawn would have to be on rank 5
    const pawnBB = pos.bbsHi[WHITE_PAWN];
    let mask = bPMasksHi[epSq] & pawnBB;
    while (mask) {
      const from = lsb(0, mask);
      mask &= mask - 1;

      buffer[start + count++] = encodeMove(
        from,
        epSq,
        WHITE_PAWN,
        BLACK_PAWN,
        NO_PIECE,
        FLAG_EP,
      );
    }
  } else {
    // only need lo as ep square must be on rank 3, so any pawn would have to be on rank 4
    const pawnBB = pos.bbsLo[BLACK_PAWN];
    let mask = wPMasksLo[epSq] & pawnBB;
    while (mask) {
      const from = lsb(mask, 0);
      mask &= mask - 1;

      buffer[start + count++] = encodeMove(
        from,
        epSq,
        BLACK_PAWN,
        WHITE_PAWN,
        NO_PIECE,
        FLAG_EP,
      );
    }
  }

  return count;
};
