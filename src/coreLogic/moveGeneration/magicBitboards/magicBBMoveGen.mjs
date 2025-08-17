import { bishopAttackTable, rookAttackTable } from "../../attackTables.mjs";
import { bishopMasks, rookMasks } from "./generateMasks.mjs";
import {
  bishopMagics,
  bishopShifts,
  rookMagics,
  rookShifts,
} from "./magicNumbers.mjs";

/**
 * Gets the attack mask for a bishop at a given square using
 * magic bitboards.
 *
 * @param {number} sq - the square where the bishop is
 * @param {bigint} occ - the occupancy bitboard
 * @returns {bigint} the attack mask for the bishop
 */
export function bishopAttacks(sq, occ) {
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
export function rookAttacks(sq, occ) {
  const mask = occ & rookMasks[sq];

  const index = Number(
    BigInt.asUintN(64, mask * rookMagics[sq]) >> BigInt(rookShifts[sq])
  );

  return rookAttackTable[sq][index];
}
