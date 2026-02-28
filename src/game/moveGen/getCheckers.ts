import { knightMasks } from "../attackMasks/knightMasks.ts";
import type { Position } from "../Position.ts";
import { blackPawnMasks, whitePawnMasks } from "../attackMasks/pawnMasks.ts";
import { bishopAttacks, rookAttacks } from "./sliderMoves.ts";
import {
  BLACK_BISHOP,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  WHITE,
  WHITE_BISHOP,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
  type Player,
  type Square,
} from "../chessConstants.ts";

/**
 * Finds all pieces that put a given player's king in check and returns
 * them all on a bitboard.
 */
export function getCheckers(pos: Position, player: Player): bigint {
  const isWhite = player === WHITE;
  const kingSq = pos.kingSq[player];

  const pawnBB = pos.bitboards[isWhite ? BLACK_PAWN : WHITE_PAWN];
  const pawnCheckMask =
    (isWhite ? whitePawnMasks[kingSq] : blackPawnMasks[kingSq]) & pawnBB;

  const knightBB = pos.bitboards[isWhite ? BLACK_KNIGHT : WHITE_KNIGHT];
  const knightCheckMask = knightMasks[kingSq] & knightBB;

  const slidingMask = slidingCheckMask(pos, kingSq, isWhite);

  return pawnCheckMask | knightCheckMask | slidingMask;
}

/**
 * Computes the checkers bitboard for sliding pieces (bishop, rook, queen)
 */
function slidingCheckMask(
  pos: Position,
  kingSq: Square,
  isWhite: boolean,
): bigint {
  let mask = 0n;
  const occ = pos.occupied;
  const bitboards = pos.bitboards;

  // Orthogonal Directions
  let orthBB = rookAttacks(kingSq, occ);

  let orthBlockers = orthBB & occ;
  const orthAttackers = isWhite
    ? bitboards[BLACK_ROOK] | bitboards[BLACK_QUEEN]
    : bitboards[WHITE_ROOK] | bitboards[WHITE_QUEEN];
  mask |= orthBlockers & orthAttackers;

  // Diagonal Directions
  const diagBB = bishopAttacks(kingSq, occ);

  let diagBlockers = diagBB & occ;
  const diagAttackers = isWhite
    ? bitboards[BLACK_BISHOP] | bitboards[BLACK_QUEEN]
    : bitboards[WHITE_BISHOP] | bitboards[WHITE_QUEEN];
  mask |= diagAttackers & diagBlockers;

  return mask;
}
