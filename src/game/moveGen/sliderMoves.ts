import { bishopAttackTable, rookAttackTable } from "../../coreLogic/attackTables.mjs";
import { bishopMasks, rookMasks } from "./magicNumbers/slidingMasks.ts";
import {
  bishopMagics,
  bishopShifts,
  rookMagics,
  rookShifts,
} from "./magicNumbers/magicNumbers.ts";
import type { Square } from "../types.ts";

/**
 * Gets the attack mask for a bishop at a given square using
 * magic bitboards.
 *
 * @param {number} sq - the square where the bishop is
 * @param {bigint} occ - the occupancy bitboard
 * @returns {bigint} the attack mask for the bishop
 */
export function bishopAttacks(sq: Square, occ: bigint): bigint {
  const mask = occ & bishopMasks[sq];
  const index = Number(
    BigInt.asUintN(64, mask * bishopMagics[sq]) >> BigInt(bishopShifts[sq])
  );

  return bishopAttackTable[sq][index];
}

/**
 * Gets the attack mask for a rook at a given square using
 * magic bitboards.
 *
 * @param {number} sq - the square where the rook is
 * @param {bigint} occ - the occupancy bitboard
 * @returns {bigint} the attack mask for the rook
 */
export function rookAttacks(sq: Square, occ: bigint): bigint {
  const mask = occ & rookMasks[sq];

  const index = Number(
    BigInt.asUintN(64, mask * rookMagics[sq]) >> BigInt(rookShifts[sq])
  );

  return rookAttackTable[sq][index];
}
