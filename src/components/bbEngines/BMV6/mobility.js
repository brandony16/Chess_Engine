import { getPlayerIndicies } from "../../../coreLogic/pieceIndicies.mjs";
import * as C from "../../../coreLogic/constants.mjs";
import {
  getAllPieces,
  getPlayerBoard,
  pieceAt,
} from "../../../coreLogic/pieceGetters.mjs";
import { isPawn } from "../../../coreLogic/helpers/pieceUtils";
import { attacksOf } from "../../../coreLogic/PieceMasks/individualAttackMasks.mjs";
import { popcount } from "../../../coreLogic/helpers/bbUtils.mjs";

export const calculateMobility = (bitboards, player) => {
  const pieceIndicies = getPlayerIndicies(player);
  const occupancy = getAllPieces(bitboards);
  const ownOccupancy = getPlayerBoard(player, bitboards);

  let mobility = 0;
  for (const idx of pieceIndicies) {
    const piece = pieceAt[idx];

    // Don't care about pawns
    if (isPawn(piece)) continue;

    const attacks = attacksOf(occupancy, piece, idx);
    const pseudolegalMoves = attacks & ~ownOccupancy; // Mask out moves to own pieces

    mobility += popcount(pseudolegalMoves) * MOBILITY_WEIGHTS[piece];
  }

  return mobility;
};

// Per piece weights for mobility
const MOBILITY_WEIGHTS = {
  [C.WHITE_PAWN]: 0, // Pawn mobility is not considered
  [C.BLACK_PAWN]: 0,
  [C.WHITE_KNIGHT]: 40,
  [C.BLACK_KNIGHT]: 40,
  [C.WHITE_BISHOP]: 40,
  [C.BLACK_BISHOP]: 40,
  [C.WHITE_ROOK]: 30,
  [C.BLACK_ROOK]: 30,
  [C.WHITE_QUEEN]: 20,
  [C.BLACK_QUEEN]: 20,
  [C.WHITE_KING]: 5,
  [C.BLACK_KING]: 5,
};
