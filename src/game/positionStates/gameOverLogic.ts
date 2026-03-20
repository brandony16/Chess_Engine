import { popcount } from "../bb.ts";
import {
  BLACK,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  WHITE,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../chessConstants.ts";

/**
 * Determines if the game is a draw because neither side has sufficient checkmating material.
 * Only insufficient if both sides only have 1 or 0 minor pieces (knight and bishop).
 */
export const drawByInsufficientMaterial = (
  bbsLo: Int32Array,
  bbsHi: Int32Array,
  playerOccLo: Int32Array,
  playerOccHi: Int32Array,
): boolean => {
  const queensLo = bbsLo[WHITE_QUEEN] | bbsLo[BLACK_QUEEN];
  const queensHi = bbsHi[WHITE_QUEEN] | bbsHi[BLACK_QUEEN];
  const rooksLo = bbsLo[WHITE_ROOK] | bbsLo[BLACK_ROOK];
  const rooksHi = bbsHi[WHITE_ROOK] | bbsHi[BLACK_ROOK];
  const pawnsLo = bbsLo[WHITE_PAWN] | bbsLo[BLACK_PAWN];
  const pawnsHi = bbsHi[WHITE_PAWN] | bbsHi[BLACK_PAWN];

  if (queensLo || queensHi || rooksLo || rooksHi || pawnsLo || pawnsHi) {
    return false;
  }

  if (
    popcount(playerOccLo[WHITE], playerOccHi[WHITE]) <= 2 &&
    popcount(playerOccLo[WHITE], playerOccHi[WHITE]) <= 2
  ) {
    return true;
  }

  return false;
};

/**
 * Determines if the same position has been repeated three times. If so the game is a draw.
 * Note: The positon is NOT the same if the pieces are the same and whose move it is is
 * different. It is also not the same if en Passant was legal, and is no longer legal.
 */
export const drawByRepetition = (
  pastPositions: BigUint64Array,
  halfmoveClock: number,
  currPly: number,
): boolean => {
  const currentKey = pastPositions[currPly];

  let repetitions = 1; // include current position

  const minPly = Math.max(0, currPly - halfmoveClock);

  for (let i = currPly - 2; i >= minPly; i -= 2) {
    if (pastPositions[i] === currentKey) {
      repetitions++;

      if (repetitions >= 3) {
        return true;
      }
    }
  }

  return false;
};
