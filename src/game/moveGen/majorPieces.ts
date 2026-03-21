import { bishopAttacks, rookAttacks } from "./sliderMoves.ts";
import type { Position } from "../Position.ts";
import { BK, BQ, WHITE, WK, WQ, type Square } from "../chessConstants.ts";
import {
  isKingsideCastleLegal,
  isQueensideCastleLegal,
} from "../moveMaking/castling.ts";
import { playerAttackMask } from "../attackMasks/attackMasks.ts";
import { opponent } from "../helpers/opponent.ts";
import type { Bitboard } from "../bb.ts";
import { kingMasksHi, kingMasksLo } from "../attackMasks/kingMasks.ts";

/**
 * Gets all legal rook moves for a given square
 */
export const rookMoves = (pos: Position, from: Square): Bitboard => {
  const [lo, hi] = rookAttacks(from, pos.occupiedLo, pos.occupiedHi);

  const finalLo = lo & ~pos.playerOccLo[pos.sideToMove];
  const finalHi = hi & ~pos.playerOccHi[pos.sideToMove];
  return [finalLo, finalHi];
};

/**
 * Gets all legal queen moves for a square
 */
export const queenMoves = (pos: Position, from: Square): Bitboard => {
  const [orthoLo, orthoHi] = rookAttacks(from, pos.occupiedLo, pos.occupiedHi);
  const [diagLo, diagHi] = bishopAttacks(from, pos.occupiedLo, pos.occupiedHi);

  const lo = orthoLo | diagLo;
  const hi = orthoHi | diagHi;
  const finalLo = lo & ~pos.playerOccLo[pos.sideToMove];
  const finalHi = hi & ~pos.playerOccHi[pos.sideToMove];
  return [finalLo, finalHi];
};

