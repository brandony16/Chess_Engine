import { bigIntFullRep } from "../../debugFunctions.mjs";
import { bitScanForward } from "../../helpers/bbUtils.mjs";
import { isBishop, isQueen, isRook } from "../../helpers/pieceUtils.mjs";
import { getLeastValuableBit } from "../../leastValuableBit.mjs";
import {
  getAllPieces,
  getBishops,
  getPawns,
  getQueens,
  getRooks,
  pieceAt,
} from "../../pieceGetters.mjs";
import { attacksTo } from "../../PieceMasks/attacksTo.mjs";
import { weights } from "./evaluation/evaluation.mjs";

/**
 * Function that returns the static exchange evaluation of a position.
 * Evaluates capture sequences on a square to determine their static evaluation.
 * Based of the ChessProgammingWiki's implementation: https://www.chessprogramming.org/SEE_-_The_Swap_Algorithm
 *
 * @param {BigUint64Array} bitboards - bitboards of the position
 * @param {number} target - the piece at the target square
 * @param {number} fromSq - the square the first piece is moving from
 * @param {number} toSq - the square the first piece is moving to
 * @param {number} moverPiece - the first piece
 * @param {0 | 1} sideToMove - whose move it is
 * @returns {number} - The SEE of the position
 */
export const SEE = (
  bitboards,
  target,
  fromSq,
  toSq,
  moverPiece,
  sideToMove
) => {
  let occupancy = getAllPieces(bitboards);
  let attadef = attacksTo(bitboards, occupancy, toSq); // Attackers and defenders

  // Get all pieces that could potentially open up an X-Ray
  const mayXRay =
    getPawns(bitboards) |
    getBishops(bitboards) |
    getRooks(bitboards) |
    getQueens(bitboards);

  const gain = [];
  let d = 0; // Depth

  // First capture
  gain[d] = weights[target % 6];

  let fromSet = 1n << BigInt(fromSq);
  let piece = moverPiece;
  do {
    d++;

    gain[d] = weights[piece % 6] - gain[d - 1];

    attadef ^= fromSet;
    occupancy ^= fromSet;
    if (fromSet & mayXRay) {
      attadef |= considerXRays(fromSet, toSq);
    }
    fromSet = getLeastValuableBit(bitboards, attadef, d & 1);
    piece = getPieceType(fromSet);
  } while (fromSet);
  while (--d) {
    const side = sideToMove ^ (d - 1);
    gain[d - 1] = -Math.max(-gain[side], gain[d]);
  }

  return gain[0];
};

function getPieceType(bb) {
  const sq = bitScanForward(bb);
  return pieceAt[sq];
}

function considerXRays(fromSet, targetSq) {
  const targetRow = Math.floor(targetSq / 8);
  const targetCol = targetSq % 8;

  const fromSq = bitScanForward(fromSet);
  const fromRow = Math.floor(fromSq / 8);
  const fromCol = fromSq % 8;

  // Find direction from targetSq to fromSq
  const rowDiff = fromRow - targetRow;
  const colDiff = fromCol - targetCol;

  // Normalize values
  const rowDir = rowDiff / Math.abs(rowDiff);
  const colDir = colDiff / Math.abs(colDiff);

  // Find next piece
  let row = fromRow + rowDir;
  let col = fromCol + colDir;
  let candidatePiece = null;
  let candidateSq = null;
  while (row >= 0 && row < 8 && col >= 0 && col < 8) {
    const sq = row * 8 + col;
    const piece = pieceAt[sq];
    if (piece) {
      candidatePiece = piece;
      candidateSq = sq;
      break;
    }

    row += rowDir;
    col += colDir;
  }

  if (!candidatePiece || !candidateSq) return 0n;

  // Orthogonal Move (Rooks and Queens)
  if (rowDiff === 0 || colDiff === 0) {
    if (isQueen(candidatePiece) || isRook(candidatePiece)) {
      return 1n << BigInt(candidateSq);
    }
    return 0n;
  }

  // Diagonal Move (Bishops and Queens)
  if (isBishop(candidatePiece) || isQueen(candidatePiece)) {
    return 1n << BigInt(candidateSq);
  }

  return 0n;
}
