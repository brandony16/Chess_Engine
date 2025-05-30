import { bitScanForward } from "../bbUtils";
import * as C from "../constants";
import {
  getDiagAttackersBitboard,
  getOrthAttackersBitboard,
  getPlayerBoard,
} from "../pieceGetters";
import { BETWEEN } from "./checkersMask";
import { bishopAttacks, rookAttacks } from "./magicBitboards/attackTable";

/**
 * Computes a bitboard of all of a players pinned pieces.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {0 | 1} player - the player to compute the pinned pieces for
 * @param {number} - the index of the square where the player's king is
 * @returns {bigint} the bitboard of the pinned pieces
 */
export function computePinned(bitboards, player, kingSq) {
  const isWhite = player === C.WHITE;

  const playerPieces = getPlayerBoard(player, bitboards);
  const oppPieces = getPlayerBoard(isWhite ? C.BLACK : C.WHITE, bitboards);

  // Pinner candidates are pieces that are on the same diagonal or row/file as the king
  // and can move along that diagonal or row/file.
  const opponent = isWhite ? C.BLACK : C.WHITE;
  const orthPinnerCandidates =
    rookAttacks(kingSq, oppPieces) &
    getOrthAttackersBitboard(bitboards, opponent);
  const diagPinnerCandidates =
    bishopAttacks(kingSq, oppPieces) &
    getDiagAttackersBitboard(bitboards, opponent);

  let pinnedBB = 0n;

  // Helper to test pinners of one type
  function scanPinners(pinners) {
    let mask = pinners;
    while (mask) {
      const pinnerSq = bitScanForward(mask);
      mask &= mask - 1n;

      const betweenMask = BETWEEN[kingSq][pinnerSq];
      const inter = betweenMask & playerPieces;

      // If exactly one blocker in between, its a pinned piece
      if (inter !== 0n && (inter & (inter - 1n)) === 0n) {
        pinnedBB |= inter;
      }
    }
  }

  scanPinners(orthPinnerCandidates);
  scanPinners(diagPinnerCandidates);

  return pinnedBB;
}

/**
 * Given a king’s square, returns a function that for any
 * square will produce a bitboard mask of
 * the ray between that square and the king.
 *
 * @param {number} kingSq - 0–63 index of your king
 * @returns {(fromSq:number)=>bigint}
 */
export function makePinRayMaskGenerator(kingSq) {
  // compute king’s file/rank
  const kFile = kingSq % 8;
  const kRank = Math.floor(kingSq / 8);

  return function getPinRayMask(fromSq) {
    const fFile = fromSq % 8;
    const fRank = Math.floor(fromSq / 8);

    // delta from piece to king
    const df = fFile - kFile;
    const dr = fRank - kRank;

    // normalize direction to -1, 0, or +1
    const normFile = df === 0 ? 0 : df / Math.abs(df);
    const normRow = dr === 0 ? 0 : dr / Math.abs(dr);

    // must be straight or diagonal
    const isStraight = normFile === 0 || normRow === 0;
    const isDiagonal = Math.abs(df) === Math.abs(dr);
    if (!(isStraight || isDiagonal)) return 0n;

    let mask = 0n;
    let curFile = kFile + normFile;
    let curRank = kRank + normRow;

    // step until the edge of the board
    while (curFile >= 0 && curFile < 8 && curRank >= 0 && curRank < 8) {
      const sq = curRank * 8 + curFile;
      mask |= 1n << BigInt(sq);

      curFile += normFile;
      curRank += normRow;
    }

    return mask;
  };
}
