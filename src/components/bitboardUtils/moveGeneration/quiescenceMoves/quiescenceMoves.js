import { bitScanForward } from "../../bbUtils";
import { BLACK_KING, WHITE, WHITE_KING } from "../../constants";
import { getBlackPieces, getWhitePieces } from "../../pieceGetters";
import { getAttackMask } from "../../PieceMasks/attackMask";
import { computePinned, makePinRayMaskGenerator } from "../computePinned";
import {
  kingQuiescence,
  queenQuiescence,
  rookQuiescence,
} from "./majorPieceQuiescence";
import { bishopQuiescence, knightQuiescence } from "./minorPieceQuiescence";
import { pawnQuiescence } from "./pawnQuiescence";

/**
 * Generates quiescence moves for a position. These are captures and promotions.
 * Helps avoid the horizon effect where engines cant correctly evaluate capture
 * sequences due to limited depth.
 * @param {BigUint64Array} bitboards - the bitboard of the position
 * @param {0 | 1} player - whose moves to get
 * @param {number} enPassantSquare - the en passant square
 * @returns {Array<Move>} - the quiescence moves
 */
export const getQuiescenceMoves = (
  bitboards,
  player,
  enPassantSquare,
) => {
  const moves = [];

  const isWhite = player === WHITE;
  const oppPieces = isWhite
    ? getBlackPieces(bitboards)
    : getWhitePieces(bitboards);
  const oppAttackMask = getAttackMask(player);
  const pinnedMask = computePinned(bitboards, player);

  const kingSq = bitScanForward(bitboards[isWhite ? WHITE_KING : BLACK_KING]);
  const getRayMask = makePinRayMaskGenerator(kingSq);
  if (kingSq === -1) {
    throw new Error('no king');
  }

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
