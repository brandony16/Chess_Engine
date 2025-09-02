import { popcount } from "../../../helpers/bbUtils.mjs";
import { isKing, isPawn } from "../../../helpers/pieceUtils.mjs";
import {
  getAllPieces,
  getPlayerBoard,
  pieceAt,
} from "../../../pieceGetters.mjs";
import { getPlayerIndicies } from "../../../pieceIndicies.mjs";
import { attacksOf } from "../../../PieceMasks/individualAttackMasks.mjs";
import { getMobility } from "./mobilityTables.mjs";

/**
 * Calculates the mobility score for a given player.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {0 | 1} player - whose mobility to calculate
 * @returns {number} - the mobility of the given player
 */
export const calculateMobility = (bitboards, player, phase) => {
  const pieceIndicies = getPlayerIndicies(player);
  const occupancy = getAllPieces(bitboards);
  const ownOccupancy = getPlayerBoard(player, bitboards);

  let mobility = 0;
  for (const idx of pieceIndicies) {
    const piece = pieceAt[idx];

    // Pawns and king are not taken into consideration.
    // Are instead handled fully by piece square tables
    if (isPawn(piece) || isKing(piece)) continue;

    const attacks = attacksOf(occupancy, piece, idx);
    const pseudolegalMoves = attacks & ~ownOccupancy; // Mask out moves to own pieces

    const numMoves = popcount(pseudolegalMoves);
    mobility += getMobility(piece, numMoves, phase);
  }

  return mobility;
};
