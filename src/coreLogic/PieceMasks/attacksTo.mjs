import { BLACK_PAWN, WHITE_PAWN } from "../constants.mjs";
import {
  bishopAttacks,
  rookAttacks,
} from "../moveGeneration/magicBitboards/magicBBMoveGen.mjs";
import {
  getBishops,
  getKings,
  getKnights,
  getQueens,
  getRooks,
} from "../pieceGetters.mjs";
import { kingMasks } from "./kingMask.mjs";
import { knightMasks } from "./knightMask.mjs";
import { blackPawnMasks, whitePawnMasks } from "./pawnMask.mjs";

/**
 * Gets all of the pieces that attack a given square.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {bigint} occ - the occupancy bitboard of the position
 * @param {number} toSq - the square to get the attacks to
 * @returns {bigint} a bitboard with all of the attackers of the square
 */
export function attacksTo(bitboards, occ, toSq) {
  let attackers = 0n;

  // Pawns
  attackers |= bitboards[WHITE_PAWN] & blackPawnMasks[toSq];
  attackers |= bitboards[BLACK_PAWN] & whitePawnMasks[toSq];

  // Knights
  const knights = getKnights(bitboards);
  attackers |= knightMasks[toSq] & knights;

  // Kings
  const kings = getKings(bitboards);
  attackers |= kingMasks[toSq] & kings;

  // Sliding Pieces
  const queens = getQueens(bitboards);
  const orthoPieces = rookAttacks(toSq, occ) & occ;
  attackers |= orthoPieces & (getRooks(bitboards) | queens);

  const diagPieces = bishopAttacks(toSq, occ) & occ;
  attackers |= diagPieces & (getBishops(bitboards) | queens);

  return attackers;
}
