import { blackPawnMasks, whitePawnMasks } from "../PieceMasks/pawnMask";
import { getAllPieces, getPieceAtSquare } from "../pieceGetters";
import * as C from "../constants";
import { knightMasks } from "../PieceMasks/knightMask";
import { slide } from "../generalHelpers";
import { bitScanForward } from "../bbUtils";
import { bishopAttacks, rookAttacks } from "./magicBitboards/attackTable";

/**
 * Finds all pieces that put a given player's king in check and returns
 * them all on a bitboard.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {0 | 1} player - the player to find the pieces attacking their king
 * @param {number} kingSq - the square of the player's king (0-63)
 * @returns {bigint} a bitboard of the checkers
 */
export function getCheckers(bitboards, player, kingSq) {
  const isWhite = player === C.WHITE;

  const pawnBB = bitboards[isWhite ? C.BLACK_PAWN : C.WHITE_PAWN];
  const pawnCheckMask =
    (isWhite ? whitePawnMasks[kingSq] : blackPawnMasks[kingSq]) & pawnBB;

  const knightBB = bitboards[isWhite ? C.BLACK_KNIGHT : C.WHITE_KNIGHT];
  const knightCheckMask = knightMasks[kingSq] & knightBB;

  const slidingMask = slidingCheckMask(
    bitboards,
    kingSq,
    getAllPieces(bitboards),
    isWhite
  );

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
function slidingCheckMask(bitboards, kingSq, occupancy, isWhite) {
  let mask = 0n;

  // Orthogonal Directions
  let orthBB = rookAttacks(kingSq, occupancy);
  let orthBlockers = orthBB & occupancy;
  while (orthBlockers !== 0n) {
    const blockerSq = bitScanForward(orthBlockers);
    const piece = getPieceAtSquare(blockerSq, bitboards);

    if (
      (isWhite && (piece === C.BLACK_ROOK || piece === C.BLACK_QUEEN)) ||
      (!isWhite && (piece === C.WHITE_ROOK || piece === C.WHITE_QUEEN))
    ) {
      mask |= 1n << BigInt(blockerSq);
    }
    orthBlockers &= orthBlockers - 1n;
  }

  // Diagonal Directions
  const diagBB = bishopAttacks(kingSq, occupancy);

  let diagBlockers = diagBB & occupancy;
  while (diagBlockers !== 0n) {
    const blockerSq = bitScanForward(diagBlockers);
    const piece = getPieceAtSquare(blockerSq, bitboards);

    if (
      (isWhite && (piece === C.BLACK_BISHOP || piece === C.BLACK_QUEEN)) ||
      (!isWhite && (piece === C.WHITE_BISHOP || piece === C.WHITE_QUEEN))
    ) {
      mask |= 1n << BigInt(blockerSq);
    }
    diagBlockers &= diagBlockers - 1n;
  }

  return mask;
}

export function getRayBetween(sq1, sq2) {
  if (sq1 === sq2) {
    return 0n;
  }

  const f1 = sq1 % 8;
  const r1 = (sq1 - f1) / 8;
  const f2 = sq2 % 8;
  const r2 = (sq2 - f2) / 8;

  const dr = r2 - r1;
  const df = f2 - f1;
  const normDr = dr / Math.abs(dr);
  const normDf = df / Math.abs(df);

  const bb1 = 1n << BigInt(sq1);
  const bb2 = 1n << BigInt(sq2);

  const rowMask = dr > 0 ? C.RANK_8_MASK : C.RANK_1_MASK;
  const fileMask = df > 0 ? C.FILE_H_MASK : C.FILE_A_MASK;
  const occ = bb1 | bb2;
  if (dr === 0) {
    const mask = slide(bb1, BigInt(normDf), fileMask, occ);
    return mask & ~bb2;
  }
  if (df === 0) {
    const mask = slide(bb1, BigInt(normDr * 8), rowMask, occ);
    return mask & ~bb2;
  }

  if (Math.abs(dr) !== Math.abs(df)) {
    throw new Error(`No compass direction between ${sq1} & ${sq2}`);
  }

  const diagMask = slide(
    bb1,
    BigInt(normDr * 8 + normDf),
    rowMask & fileMask,
    occ
  );

  return diagMask & ~bb2;
}
