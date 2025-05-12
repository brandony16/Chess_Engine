import { blackPawnMasks, whitePawnMasks } from "../PieceMasks/pawnMask";
import { getAllPieces, getPieceAtSquare } from "../pieceGetters";
import * as C from "../constants";
import { knightMasks } from "../PieceMasks/knightMask";
import { slide } from "../generalHelpers";
import { bitScanForward } from "../bbUtils";

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

function slidingCheckMask(bitboards, kingSq, occupancy, isWhite) {
  let mask = 0n;

  const pieceBB = 1n << BigInt(kingSq);

  // Orthogonal Directions
  const orthArr = [];
  orthArr[0] = slide(pieceBB, 1n, C.FILE_H_MASK, occupancy); // Right
  orthArr[1] = slide(pieceBB, -1n, C.FILE_A_MASK, occupancy); // Left
  orthArr[2] = slide(pieceBB, 8n, C.RANK_8_MASK, occupancy); // Up
  orthArr[3] = slide(pieceBB, -8n, C.RANK_1_MASK, occupancy); // Down

  for (const bb of orthArr) {
    const blocker = bb & occupancy;
    if (blocker !== 0n) {
      const blockerSq = bitScanForward(blocker);
      const piece = getPieceAtSquare(blockerSq, bitboards);

      if (
        (isWhite && (piece === C.BLACK_ROOK || piece === C.BLACK_QUEEN)) ||
        (!isWhite && (piece === C.WHITE_ROOK || piece === C.WHITE_QUEEN))
      ) {
        mask |= 1n << BigInt(blockerSq);
      }
    }
  }

  // Diagonal Directions
  const diagArr = [];
  diagArr[0] = slide(pieceBB, 9n, C.FILE_H_MASK & C.RANK_8_MASK, occupancy); // Up-right
  diagArr[1] = slide(pieceBB, 7n, C.FILE_A_MASK & C.RANK_8_MASK, occupancy); // Up-left
  diagArr[2] = slide(pieceBB, -7n, C.FILE_H_MASK & C.RANK_1_MASK, occupancy); // Down-right
  diagArr[3] = slide(pieceBB, -9n, C.FILE_A_MASK & C.RANK_1_MASK, occupancy); // Down-left

  for (const bb of diagArr) {
    const blocker = bb & occupancy;
    if (blocker !== 0n) {
      const blockerSq = bitScanForward(blocker);
      const piece = getPieceAtSquare(blockerSq, bitboards);

      if (
        (isWhite && (piece === C.BLACK_BISHOP || piece === C.BLACK_QUEEN)) ||
        (!isWhite && (piece === C.WHITE_BISHOP || piece === C.WHITE_QUEEN))
      ) {
        mask |= 1n << BigInt(blockerSq);
      }
    }
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
