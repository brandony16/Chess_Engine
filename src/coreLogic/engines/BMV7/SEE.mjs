import { getLeastValuableBit } from "../../leastValuableBit.mjs";
import {
  getAllPieces,
  getBishops,
  getPawns,
  getQueens,
  getRooks,
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
  gain[d] = weights[target];

  let fromSet = 1n << BigInt(fromSq);
  do {
    d++;

    gain[d] = weights[moverPiece] - gain[d - 1];

    attadef ^= fromSet;
    occupancy ^= fromSet;
    if (fromSet & mayXRay) {
      attadef |= considerXRays();
    }
    fromSet = getLeastValuableBit(bitboards, attadef, d & 1);
  } while (fromSet);

  while (--d) {
    const side = sideToMove ^ (d - 1);
    gain[d - 1] = -Math.max(-gain[side], gain[d]);
  }
  return gain[0];
};

function considerXRays() {
  // TODO: Implement this por favor
}
