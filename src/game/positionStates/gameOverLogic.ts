import { getNumPieces } from "../../coreLogic/helpers/bbUtils.mjs";
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
  bitboards: BigUint64Array,
  playerOcc: bigint[], // indexed by player
): boolean => {
  const queens = bitboards[WHITE_QUEEN] | bitboards[BLACK_QUEEN];
  const rooks = bitboards[WHITE_ROOK] | bitboards[BLACK_ROOK];
  const pawns = bitboards[WHITE_PAWN] | bitboards[BLACK_PAWN];
  const queensRooksPawns = queens | rooks | pawns;

  if (queensRooksPawns !== 0n) {
    return false;
  }

  if (
    getNumPieces(playerOcc[WHITE]) <= 2 &&
    getNumPieces(playerOcc[BLACK]) <= 2
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
  pastPositions: Map<bigint, number>,
): boolean => {
  for (const count of pastPositions.values()) {
    if (count >= 3) {
      return true;
    }
  }
  return false;
};
