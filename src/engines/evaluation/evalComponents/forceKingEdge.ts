import type { Square } from "../../../game/chessConstants.ts";
import { getFile, getRank } from "../../../game/helpers/boardUtils.ts";

/**
 * Calculates an evaluation component based on the the position of the kings.
 * In endgames, you want the opponents king closer to the edge of the board and your king close to the other king to help shoulder it and deliver checkmate
 *
 * @param friendlyKingSq square of friendly king
 * @param oppKingSq square of enemy king
 * @param endgameWeight how heavily weighted this should be. higher the later in the game it is
 * @returns The evaluation relative to the friendly kings side
 */
export function forceKingToEdgeEndgameEval(
  friendlyKingSq: Square,
  oppKingSq: Square,
  endgameWeight: number,
): number {
  let evaluation: number = 0;

  const oppKingRank = getRank(oppKingSq);
  const oppKingFile = getFile(oppKingSq);

  const oppDistToCenterFile = Math.max(3 - oppKingFile, oppKingFile - 4);
  const oppDistToCenterRank = Math.max(3 - oppKingRank, oppKingRank - 4);
  const oppDistFromCenter = oppDistToCenterFile + oppDistToCenterRank;
  evaluation += oppDistFromCenter; // want opponent king further from center

  const friendlyKingRank = getRank(friendlyKingSq);
  const friendlyKingFile = getFile(friendlyKingSq);

  const rankDistBetweenKings = Math.abs(oppKingRank - friendlyKingRank);
  const fileDistBetweenKings = Math.abs(oppKingFile - friendlyKingFile);
  const distBetweenKings = rankDistBetweenKings + fileDistBetweenKings;

  // want kings to be closer. 14 is max distance (7 ranks and 7 files away)
  evaluation += 14 - distBetweenKings;

  return evaluation * 10 * endgameWeight;
}
