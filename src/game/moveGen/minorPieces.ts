import { type Square } from "../chessConstants.ts";
import type { Position } from "../Position.ts";
import { bishopAttacks } from "./sliderMoves.ts";
import { knightMasksHi, knightMasksLo } from "../attackMasks/knightMasks.ts";
import { type Bitboard } from "../bb.ts";

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
