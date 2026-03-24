import { knightMasksHi, knightMasksLo } from "../attackMasks/knightMasks.ts";
import type { Position } from "../Position.ts";
import {
  bPMasksHi,
  bPMasksLo,
  wPMasksHi,
  wPMasksLo,
} from "../attackMasks/pawnMasks.ts";
import { bishopAttacks, rookAttacks } from "./sliderMoves.ts";
import {
  BLACK_BISHOP,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  WHITE,
  WHITE_BISHOP,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
  type Player,
  type Square,
} from "../chessConstants.ts";
import type { Bitboard } from "../bb.ts";

/**
 * Finds all pieces that put a given player's king in check and returns
 * them all on a bitboard.
 */
export function getCheckers(pos: Position, player: Player): Bitboard {
  const isWhite = player === WHITE;
  const kingSq = pos.kingSq[player] as Square;

  const pawn = isWhite ? BLACK_PAWN : WHITE_PAWN;
  const pawnBBLo = pos.bbsLo[pawn],
    pawnBBHi = pos.bbsHi[pawn];

  const pawnMaskLo = isWhite ? wPMasksLo : bPMasksLo;
  const pawnMaskHi = isWhite ? wPMasksHi : bPMasksHi;
  const pawnCheckLo = pawnMaskLo[kingSq] & pawnBBLo;
  const pawnCheckHi = pawnMaskHi[kingSq] & pawnBBHi;

  const knight = isWhite ? BLACK_KNIGHT : WHITE_KNIGHT;
  const knightBBLo = pos.bbsLo[knight],
    knightBBHi = pos.bbsHi[knight];

  const knightCheckLo = knightMasksLo[kingSq] & knightBBLo;
  const knightCheckHi = knightMasksHi[kingSq] & knightBBHi;

  const [slidingLo, slidingHi] = slidingCheckMask(pos, kingSq);

  const lo = pawnCheckLo | knightCheckLo | slidingLo;
  const hi = pawnCheckHi | knightCheckHi | slidingHi;
  return [lo, hi];
}

/**
 * Computes the checkers bitboard for sliding pieces (bishop, rook, queen)
 */
function slidingCheckMask(pos: Position, kingSq: Square): Bitboard {
  let maskLo = 0,
    maskHi = 0;

  const isWhite = pos.sideToMove === WHITE;
  const occLo = pos.occupiedLo,
    occHi = pos.occupiedHi;
  const bbsLo = pos.bbsLo,
    bbsHi = pos.bbsHi;

  const queen = isWhite ? BLACK_QUEEN : WHITE_QUEEN;
  const rook = isWhite ? BLACK_ROOK : WHITE_ROOK;
  const bishop = isWhite ? BLACK_BISHOP : WHITE_BISHOP;

  // Orthogonal Directions
  const [orthLo, orthHi] = rookAttacks(kingSq, occLo, occHi);

  const orthBlockersLo = orthLo & occLo;
  const orthBlockersHi = orthHi & occHi;
  const orthAttackersLo = bbsLo[queen] | bbsLo[rook];
  const orthAttackersHi = bbsHi[queen] | bbsHi[rook];

  maskLo |= orthBlockersLo & orthAttackersLo;
  maskHi |= orthBlockersHi & orthAttackersHi;

  // Diagonal Directions
  const [diagLo, diagHi] = bishopAttacks(kingSq, occLo, occHi);

  const diagBlockersLo = diagLo & occLo;
  const diagBlockersHi = diagHi & occHi;
  const diagAttackersLo = bbsLo[queen] | bbsLo[bishop];
  const diagAttackersHi = bbsHi[queen] | bbsHi[bishop];

  maskLo |= diagAttackersLo & diagBlockersLo;
  maskHi |= diagAttackersHi & diagBlockersHi;

  return [maskLo, maskHi];
}
