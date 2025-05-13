import { bitScanForward } from "../../bbUtils";
import { BLACK_KING, WHITE, WHITE_KING } from "../../constants";
import { getBlackPieces, getWhitePieces } from "../../pieceGetters";
import { getCachedAttackMask } from "../../PieceMasks/attackMask";
import { computePinned, makePinRayMaskGenerator } from "../computePinned";
import {
  kingQuiescence,
  queenQuiescence,
  rookQuiescence,
} from "./majorPieceQuiescence";
import { bishopQuiescence, knightQuiescence } from "./minorPieceQuiescence";
import { pawnQuiescence } from "./pawnQuiescence";

/**
 * A function that gets the moves for a quiescence search. These are captures and promotions.
 */
export const getQuiescenceMoves = (
  bitboards,
  player,
  enPassantSquare,
  oppAttackHash
) => {
  const moves = [];

  const isWhite = player === WHITE;
  const oppPieces = isWhite
    ? getBlackPieces(bitboards)
    : getWhitePieces(bitboards);
  const oppAttackMask = getCachedAttackMask(bitboards, player, oppAttackHash);
  const pinnedMask = computePinned(bitboards, player);

  const kingSq = bitScanForward(bitboards[isWhite ? WHITE_KING : BLACK_KING]);
  const getRayMask = makePinRayMaskGenerator(kingSq);

  moves.concat(pawnQuiescence(bitboards, player, oppPieces, enPassantSquare));
  moves.concat(knightQuiescence(bitboards, player, oppPieces, pinnedMask));
  moves.concat(
    bishopQuiescence(bitboards, player, oppPieces, pinnedMask, getRayMask)
  );
  moves.concat(
    rookQuiescence(bitboards, player, oppPieces, pinnedMask, getRayMask)
  );
  moves.concat(
    queenQuiescence(bitboards, player, oppPieces, pinnedMask, getRayMask)
  );
  moves.concat(kingQuiescence(bitboards, player, oppPieces, oppAttackMask));

  return moves;
};
