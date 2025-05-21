import { bitScanForward } from "../bbUtils";
import * as C from "../constants";
import { getAllPieces, pieceAt } from "../pieceGetters";

/**
 * Computes a bitboard of all of a players pinned pieces.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {0 | 1} player - the player to compute the pinned pieces for
 * @returns {bigint} the bitboard of the pinned pieces
 */
export function computePinned(bitboards, player) {
  const isWhite = player === C.WHITE;
  const occupancy = getAllPieces(bitboards);

  const kingBB = isWhite ? bitboards[C.WHITE_KING] : bitboards[C.BLACK_KING];
  const kingSq = bitScanForward(kingBB);

  let pinnedMask = 0n;

  const kingFile = kingSq % 8;
  const kingRow = Math.floor(kingSq / 8);

  for (let dir of C.DIRECTIONS) {
    let ownPieceSq = null;
    let file = kingFile + dir.df;
    let row = kingRow + dir.dr;

    while (file >= 0 && file < 8 && row >= 0 && row < 8) {
      const square = row * 8 + file;
      const mask = 1n << BigInt(square);

      if (occupancy & mask) {
        const piece = pieceAt[square];
        const isOwn = isWhite ? piece < 6 : piece >= 6;

        if (ownPieceSq === null) {
          // First blocker: if its our piece, set it
          // if not, theres no pin along the ray
          if (isOwn) {
            ownPieceSq = square;
          } else {
            break;
          }
        } else {
          // Second blocker: if an enemy slider, our piece is pinned
          if (isEnemySlider(piece, dir, isWhite)) {
            pinnedMask |= 1n << BigInt(ownPieceSq);
          }

          break;
        }
      }
      file += dir.df;
      row += dir.dr;
    }
  }

  return pinnedMask;
}

/**
 * Determines if a piece on a given direction is an enemy piece that can move along the ray
 *
 * @param {number} piece - the index of the piece
 * @param {{ df: number, dr: number}} dir - the direction
 * @param {boolean} isWhite - if the player is white
 * @returns {boolean} if the piece is an enemy slider on the dir
 */
function isEnemySlider(piece, dir, isWhite) {
  const isEnemy = isWhite ? piece >= 6 : piece < 6;
  if (!isEnemy) return false;

  const type = piece % 6;
  // Straight rays
  if (
    (dir.df === 0 || dir.dr === 0) &&
    (type === C.WHITE_ROOK || type === C.WHITE_QUEEN)
  ) {
    return true;
  }
  // Diagonal Rays
  if (
    dir.df !== 0 &&
    dir.dr !== 0 &&
    (type === C.WHITE_BISHOP || type === C.WHITE_QUEEN)
  ) {
    return true;
  }
  return false;
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
