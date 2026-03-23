import {
  bishopAttackTableHi,
  bishopAttackTableLo,
  rookAttackTableHi,
  rookAttackTableLo,
} from "../attackTables.ts";
import {
  bishopMasksHi,
  bishopMasksLo,
  rookMasksHi,
  rookMasksLo,
} from "./magicNumbers/slidingMasks.ts";
import {
  bishopMagics,
  bishopShifts,
  rookMagics,
  rookShifts,
} from "./magicNumbers/magicNumbers.ts";
import type { Square } from "../chessConstants.ts";
import { bbFromBigInt, bbToBigInt, type Bitboard } from "../bb.ts";

/**
 * Gets the attack mask for a bishop at a given square using
 * magic bitboards.
 */
export function bishopAttacks(
  sq: Square,
  occLo: number,
  occHi: number,
): Bitboard {
  const maskLo = occLo & bishopMasksLo[sq];
  const maskHi = occHi & bishopMasksHi[sq];

  const mask = bbToBigInt(maskLo, maskHi);
  const index = Number(
    BigInt.asUintN(64, mask * bishopMagics[sq]) >> BigInt(bishopShifts[sq]),
  );

  return [
    bishopAttackTableLo[sq][index] >>> 0,
    bishopAttackTableHi[sq][index] >>> 0,
  ];
}

/**
 * Gets the attack mask for a rook at a given square using
 * magic bitboards.
 */
export function rookAttacks(
  sq: Square,
  occLo: number,
  occHi: number,
): Bitboard {
  const maskLo = occLo & rookMasksLo[sq];
  const maskHi = occHi & rookMasksHi[sq];

  const mask = bbToBigInt(maskLo, maskHi);
  const index = Number(
    BigInt.asUintN(64, mask * rookMagics[sq]) >> BigInt(rookShifts[sq]),
  );

  return [
    rookAttackTableLo[sq][index] >>> 0,
    rookAttackTableHi[sq][index] >>> 0,
  ];
}
