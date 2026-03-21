import {
  BP_START_RANK,
  NO_SQUARE,
  RANK_2,
  RANK_7,
  WHITE,
  WP_START_RANK,
  type Square,
} from "../chessConstants.ts";
import type { Position } from "../Position.ts";
import { bishopAttacks } from "./sliderMoves.ts";
import { opponent } from "../helpers/opponent.ts";
import { knightMasksHi, knightMasksLo } from "../attackMasks/knightMasks.ts";
import { bbShiftLeft, bbShiftRight, squareBB, type Bitboard } from "../bb.ts";
import { getRank } from "../helpers/boardUtils.ts";
import {
  bPMasksHi,
  bPMasksLo,
  wPMasksHi,
  wPMasksLo,
} from "../attackMasks/pawnMasks.ts";

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

/**
 * Gets the move bitboard for a knight.
 */
export const knightMoves = (pos: Position, from: Square): Bitboard => {
  const movesLo = knightMasksLo[from],
    movesHi = knightMasksHi[from];

  const possibleLo = movesLo & ~pos.playerOccLo[pos.sideToMove];
  const possibleHi = movesHi & ~pos.playerOccHi[pos.sideToMove];

  return [possibleLo, possibleHi];
};

/**
 * Gets the move bitboard for a bishop
 */
export const bishopMoves = (pos: Position, from: Square): Bitboard => {
  const [lo, hi] = bishopAttacks(from, pos.occupiedLo, pos.occupiedHi);

  const finalLo = lo & ~pos.playerOccLo[pos.sideToMove];
  const finalHi = hi & ~pos.playerOccHi[pos.sideToMove];

  return [finalLo, finalHi];
};
