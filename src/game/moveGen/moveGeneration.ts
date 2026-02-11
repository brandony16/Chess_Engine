import {
  bitScanForward,
  isBitSet,
  popcount,
} from "../../coreLogic/helpers/bbUtils.mjs";
import { getMovesFromBB } from "../moveMaking/makeMoveLogic.mjs";
import { pieceAt } from "../pieceUtils/pieceGetters.ts";
import {
  getPlayerIndicies,
  indexArrays,
} from "../positionStates/pieceIndexUpdators.ts";
import { getAttackMask } from "../PieceMasks/attackMask.mjs";
import {
  getCheckers,
  getRayBetween,
} from "../../coreLogic/moveGeneration/checkersMask.mjs";
import {
  computePinned,
  makePinRayMaskGenerator,
} from "../../coreLogic/moveGeneration/computePinned.mjs";
import {
  getKingMovesForSquare,
  getMagicQueenMovesForSquare,
  getMagicRookMovesForSquare,
} from "../../coreLogic/moveGeneration/majorPieceMoveGeneration.mjs";
import {
  getKnightMovesForSquare,
  getMagicBishopMovesForSquare,
  getPawnMovesForSquare,
} from "../../coreLogic/moveGeneration/minorPieceMoveGeneration.mjs";
import {
  isKing,
  isKnight,
  isPawn,
} from "../../coreLogic/helpers/pieceUtils.mjs";
import { Position } from "../Position.ts";
import type Move from "../moveMaking/move.ts";
import {
  BLACK,
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  WHITE,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../chessConstants.ts";

/**
 * Gets the moves for a specific piece. Returns a bitboard of the moves for that piece.
 */
export const getPieceMoves = (
  pos: Position,
  move: Move,
  pinnedMask: bigint,
  getRayMask: Function,
): bigint => {
  let moves = null;
  switch (move.piece) {
    case WHITE_PAWN:
    case BLACK_PAWN:
      moves = getPawnMovesForSquare(
        bitboards,
        player,
        from,
        enPassantSquare,
        pinnedMask,
        getRayMask,
      );
      break;
    case WHITE_KNIGHT:
    case BLACK_KNIGHT:
      moves = getKnightMovesForSquare(bitboards, player, from, pinnedMask);
      break;
    case WHITE_BISHOP:
    case BLACK_BISHOP:
      moves = getMagicBishopMovesForSquare(
        bitboards,
        player,
        from,
        pinnedMask,
        getRayMask,
      );
      break;
    case WHITE_ROOK:
    case BLACK_ROOK:
      moves = getMagicRookMovesForSquare(
        bitboards,
        player,
        from,
        pinnedMask,
        getRayMask,
      );
      break;
    case WHITE_QUEEN:
    case BLACK_QUEEN:
      moves = getMagicQueenMovesForSquare(
        bitboards,
        player,
        from,
        pinnedMask,
        getRayMask,
      );
      break;
    case WHITE_KING:
    case BLACK_KING:
      moves = getKingMovesForSquare(
        bitboards,
        player,
        from,
        oppAttackMask,
        castlingRights,
      );
      break;
    default:
      moves = BigInt(0); // No legal moves
  }

  return moves;
};