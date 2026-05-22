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
  let score = 0;

  const wPawnsLo = pos.bbsLo[WHITE_PAWN];
  const wPawnsHi = pos.bbsHi[WHITE_PAWN];

  const bPawnsLo = pos.bbsLo[BLACK_PAWN];
  const bPawnsHi = pos.bbsHi[BLACK_PAWN];

  for (let file = 0; file < 8; file++) {
    const fileMask = FILE_MASKS[file];
    const adjMask = ADJACENT_FILE_MASKS[file];

    // --- WHITE PAWNS ---
    const wFilePawnsLo = wPawnsLo & fileMask;
    const wFilePawnsHi = wPawnsHi & fileMask;

    if (wFilePawnsLo !== 0 || wFilePawnsHi !== 0) {
      // Doubled Pawns
      const wCount = popcount(wFilePawnsLo, wFilePawnsHi);
      if (wCount > 1) {
        // Apply penalty for every extra pawn on the file
        score += PENALTY_DOUBLED * (wCount - 1);
      }

      // Isolated Pawns - check if there are any pawns on adjacent files
      const wAdjPawnsLo = wPawnsLo & adjMask;
      const wAdjPawnsHi = wPawnsHi & adjMask;

      if (wAdjPawnsLo === 0 && wAdjPawnsHi === 0) {
        // Apply penalty for every isolated pawn on this file
        score += PENALTY_ISOLATED * wCount;
      }
    }

    // --- BLACK PAWNS ---
    const bFilePawnsLo = bPawnsLo & fileMask;
    const bFilePawnsHi = bPawnsHi & fileMask;

    if (bFilePawnsLo !== 0 || bFilePawnsHi !== 0) {
      // Doubled Pawns
      const bCount = popcount(bFilePawnsLo, bFilePawnsHi);
      if (bCount > 1) {
        // Subtract from score (Black penalties INCREASE White's score)
        score -= PENALTY_DOUBLED * (bCount - 1);
      }

      // Isolated Pawns
      const bAdjPawnsLo = bPawnsLo & adjMask;
      const bAdjPawnsHi = bPawnsHi & adjMask;

      if (bAdjPawnsLo === 0 && bAdjPawnsHi === 0) {
        score -= PENALTY_ISOLATED * bCount;
      }
    }
  }

  // ----- PASSED PAWNS -----
  // white pawns
  let wLo = wPawnsLo;
  while (wLo) {
    const sq = lsb(wLo, 0);

    if (
      (bPawnsLo & W_PASSED_LO[sq]) === 0 &&
      (bPawnsHi & W_PASSED_HI[sq]) === 0
    ) {
      const rank = sq >> 3;
      score += PASSED_PAWN_BONUS[rank];
    }
    wLo &= wLo - 1;
  }

  let wHi = wPawnsHi;
  while (wHi) {
    const sq = lsb(0, wHi);

    if (
      (bPawnsLo & W_PASSED_LO[sq]) === 0 &&
      (bPawnsHi & W_PASSED_HI[sq]) === 0
    ) {
      const rank = sq >> 3;
      score += PASSED_PAWN_BONUS[rank];
    }
    wHi &= wHi - 1;
  }

  // black pawns
  let bLo = bPawnsLo;
  while (bLo) {
    const sq = lsb(bLo, 0);

    if (
      (wPawnsLo & B_PASSED_LO[sq]) === 0 &&
      (wPawnsHi & B_PASSED_HI[sq]) === 0
    ) {
      const rank = sq >> 3;
      const invertedRank = 7 - rank; // invert rank for black
      score -= PASSED_PAWN_BONUS[invertedRank];
    }
    bLo &= bLo - 1;
  }

  // --- BLACK PAWNS (Hi Board: Ranks 5-8) ---
  let bHi = bPawnsHi;
  while (bHi) {
    const sq = lsb(0, bHi);

    if (
      (wPawnsLo & B_PASSED_LO[sq]) === 0 &&
      (wPawnsHi & B_PASSED_HI[sq]) === 0
    ) {
      const rank = sq >> 3;
      const invertedRank = 7 - rank;
      score -= PASSED_PAWN_BONUS[invertedRank];
    }
    bHi &= bHi - 1;
  }

  return score;
};
