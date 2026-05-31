import { lsb, popcount } from "../../../../game/bb.ts";
import { BLACK_PAWN, WHITE_PAWN } from "../../../../game/chessConstants.ts";
import type { Position } from "../../../../game/Position.ts";
import {
  ADJACENT_FILE_MASKS,
  B_PASSED_HI,
  B_PASSED_LO,
  FILE_MASKS,
  W_PASSED_HI,
  W_PASSED_LO,
} from "./masks.ts";

export const PENALTY_DOUBLED = -15;
export const PENALTY_ISOLATED = -20;

export const PASSED_PAWN_BONUS = [
  0, // Rank 1
  5, // Rank 2
  10, // Rank 3
  20, // Rank 4
  35, // Rank 5
  60, // Rank 6
  100, // Rank 7
  0, // Rank 8
];

/**
 * Returns the evaluation of the pawn structure.
 * Positive is white is better, negative is black is better
 *
 * @param pos the position
 * @returns the eval for the pawn structure
 */
export const evaluatePawnStructure = (pos: Position): number => {
  const wPawnsLo = pos.bbsLo[WHITE_PAWN];
  const wPawnsHi = pos.bbsHi[WHITE_PAWN];

  const bPawnsLo = pos.bbsLo[BLACK_PAWN];
  const bPawnsHi = pos.bbsHi[BLACK_PAWN];

  return (
    calculatePassedPawnScore(wPawnsLo, wPawnsHi, bPawnsLo, bPawnsHi) +
    calculateDoubledIsolatedPawnScore(wPawnsLo, wPawnsHi, bPawnsLo, bPawnsHi)
  );
};

export const calculateDoubledIsolatedPawnScore = (
  wPawnLo: number,
  wPawnHi: number,
  bPawnLo: number,
  bPawnHi: number,
): number => {
  let wPawnScore = 0;
  let bPawnScore = 0;
  for (let file = 0; file < 8; file++) {
    const fileMask = FILE_MASKS[file];
    const adjMask = ADJACENT_FILE_MASKS[file];

    // --- WHITE PAWNS ---
    const wFilePawnsLo = wPawnLo & fileMask;
    const wFilePawnsHi = wPawnHi & fileMask;

    if (wFilePawnsLo !== 0 || wFilePawnsHi !== 0) {
      // Doubled Pawns
      const wCount = popcount(wFilePawnsLo, wFilePawnsHi);
      if (wCount > 1) {
        // Apply penalty for every extra pawn on the file
        wPawnScore += PENALTY_DOUBLED * (wCount - 1);
      }

      // Isolated Pawns - check if there are any pawns on adjacent files
      const wAdjPawnsLo = wPawnLo & adjMask;
      const wAdjPawnsHi = wPawnHi & adjMask;

      if (wAdjPawnsLo === 0 && wAdjPawnsHi === 0) {
        // Apply penalty for every isolated pawn on this file
        wPawnScore += PENALTY_ISOLATED * wCount;
      }
    }

    // --- BLACK PAWNS ---
    const bFilePawnsLo = bPawnLo & fileMask;
    const bFilePawnsHi = bPawnHi & fileMask;

    if (bFilePawnsLo !== 0 || bFilePawnsHi !== 0) {
      // Doubled Pawns
      const bCount = popcount(bFilePawnsLo, bFilePawnsHi);
      if (bCount > 1) {
        bPawnScore += PENALTY_DOUBLED * (bCount - 1);
      }

      // Isolated Pawns
      const bAdjPawnsLo = bPawnLo & adjMask;
      const bAdjPawnsHi = bPawnHi & adjMask;

      if (bAdjPawnsLo === 0 && bAdjPawnsHi === 0) {
        bPawnScore += PENALTY_ISOLATED * bCount;
      }
    }
  }

  return wPawnScore - bPawnScore;
};

export const calculatePassedPawnScore = (
  wPawnLo: number,
  wPawnHi: number,
  bPawnLo: number,
  bPawnHi: number,
): number => {
  let wPawnScore = 0;
  let bPawnScore = 0;

  // white pawns
  let wLo = wPawnLo;
  while (wLo) {
    const sq = lsb(wLo, 0);

    if (
      (bPawnLo & W_PASSED_LO[sq]) === 0 &&
      (bPawnHi & W_PASSED_HI[sq]) === 0
    ) {
      const rank = sq >> 3;
      wPawnScore += PASSED_PAWN_BONUS[rank];
    }
    wLo &= wLo - 1;
  }

  let wHi = wPawnHi;
  while (wHi) {
    const sq = lsb(0, wHi);

    if (
      (bPawnLo & W_PASSED_LO[sq]) === 0 &&
      (bPawnHi & W_PASSED_HI[sq]) === 0
    ) {
      const rank = sq >> 3;
      wPawnScore += PASSED_PAWN_BONUS[rank];
    }
    wHi &= wHi - 1;
  }

  // black pawns
  let bLo = bPawnLo;
  while (bLo) {
    const sq = lsb(bLo, 0);

    if (
      (wPawnLo & B_PASSED_LO[sq]) === 0 &&
      (wPawnHi & B_PASSED_HI[sq]) === 0
    ) {
      const rank = sq >> 3;
      const invertedRank = 7 - rank; // invert rank for black
      bPawnScore += PASSED_PAWN_BONUS[invertedRank];
    }
    bLo &= bLo - 1;
  }

  let bHi = bPawnHi;
  while (bHi) {
    const sq = lsb(0, bHi);

    if (
      (wPawnLo & B_PASSED_LO[sq]) === 0 &&
      (wPawnHi & B_PASSED_HI[sq]) === 0
    ) {
      const rank = sq >> 3;
      const invertedRank = 7 - rank;
      bPawnScore += PASSED_PAWN_BONUS[invertedRank];
    }
    bHi &= bHi - 1;
  }

  return wPawnScore - bPawnScore;
};
