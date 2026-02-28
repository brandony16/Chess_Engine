import { knightMasks } from "../attackMasks/knightMasks.ts";
import { opponent } from "../helpers/opponent.ts";
import type { Position } from "../Position.ts";
import { queenMoves } from "./majorPieces.ts";
import * as C from "../chessConstants.ts";
import { blackPawnMasks, whitePawnMasks } from "../attackMasks/pawnMasks.ts";
import { bishopAttacks, rookAttacks } from "./sliderMoves.ts";

// export function getCheckers(pos: Position): bigint {
//   const kingSq = pos.kingSq[pos.sideToMove];

//   const knightAttackers = knightMasks[kingSq];
//   const slidingAttackers = queenMoves(pos, kingSq);

//   const possibleAttackers = knightAttackers | slidingAttackers;

//   return possibleAttackers & pos.playerOcc[opponent(pos.sideToMove)];
// }
/**
 * Finds all pieces that put a given player's king in check and returns
 * them all on a bitboard.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {0 | 1} player - the player to find the pieces attacking their king
 * @param {number} kingSq - the square of the player's king (0-63)
 * @returns {bigint} a bitboard of the checkers
 */
export function getCheckers(pos: Position, player: C.Player, kingSq: C.Square) {
  const isWhite = player === C.WHITE;

  const pawnBB = pos.bitboards[isWhite ? C.BLACK_PAWN : C.WHITE_PAWN];
  const pawnCheckMask =
    (isWhite ? whitePawnMasks[kingSq] : blackPawnMasks[kingSq]) & pawnBB;

  const knightBB = pos.bitboards[isWhite ? C.BLACK_KNIGHT : C.WHITE_KNIGHT];
  const knightCheckMask = knightMasks[kingSq] & knightBB;

  const slidingMask = slidingCheckMask(pos, kingSq, isWhite);

  return pawnCheckMask | knightCheckMask | slidingMask;
}

/**
 * Computes the checkers bitboard for sliding pieces (bishop, rook, queen)
 *
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {number} kingSq - the square of the king
 * @param {bigint} occupancy - the occupancy bitboard
 * @param {boolean} isWhite - if the player is white
 * @returns {bigint}
 */
function slidingCheckMask(pos: Position, kingSq: C.Square, isWhite: boolean) {
  let mask = 0n;
  const occ = pos.occupied;
  const bitboards = pos.bitboards;

  // Orthogonal Directions
  let orthBB = rookAttacks(kingSq, occ);

  let orthBlockers = orthBB & occ;
  const orthAttackers = isWhite
    ? bitboards[C.BLACK_ROOK] | bitboards[C.BLACK_QUEEN]
    : bitboards[C.WHITE_ROOK] | bitboards[C.WHITE_QUEEN];
  mask |= orthBlockers & orthAttackers;

  // Diagonal Directions
  const diagBB = bishopAttacks(kingSq, occ);

  let diagBlockers = diagBB & occ;
  const diagAttackers = isWhite
    ? bitboards[C.BLACK_BISHOP] | bitboards[C.BLACK_QUEEN]
    : bitboards[C.WHITE_BISHOP] | bitboards[C.WHITE_QUEEN];
  mask |= diagAttackers & diagBlockers;

  return mask;
}
