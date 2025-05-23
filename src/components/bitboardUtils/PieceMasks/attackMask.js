import {
  BLACK_BISHOP,
  BLACK_QUEEN,
  BLACK_ROOK,
  WHITE,
  WHITE_BISHOP,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../constants";
import { getAllPieces } from "../pieceGetters";
import {
  computeMaskForPiece,
  individualAttackMasks,
} from "./individualAttackMasks";

/**
 * Updates the individualAttackMasks array with new values based off of the
 * move made.
 * @param {BigUint64Array} bitboards - the new bitboards of the position
 * @param {Move} - the move that was made.
 */
export const updateAttackMasks = (bitboards, move) => {
  const piece = move.piece;
  const captured = move.captured;
  const promotion = move.promotion;
  const occupancy = getAllPieces(bitboards);

  // Remove old attacks of the piece
  individualAttackMasks[piece] = computeMaskForPiece(
    bitboards,
    piece,
    occupancy
  );

  if (captured !== null) {
    individualAttackMasks[captured] = computeMaskForPiece(
      bitboards,
      captured,
      occupancy
    );
  }

  if (promotion !== null) {
    individualAttackMasks[promotion] = computeMaskForPiece(
      bitboards,
      promotion,
      occupancy
    );
  }

  // Recompute sliding pieces to account for blockers
  individualAttackMasks[WHITE_BISHOP] = computeMaskForPiece(
    bitboards,
    WHITE_BISHOP,
    occupancy
  );
  individualAttackMasks[WHITE_ROOK] = computeMaskForPiece(
    bitboards,
    WHITE_ROOK,
    occupancy
  );
  individualAttackMasks[WHITE_QUEEN] = computeMaskForPiece(
    bitboards,
    WHITE_QUEEN,
    occupancy
  );
  individualAttackMasks[BLACK_BISHOP] = computeMaskForPiece(
    bitboards,
    BLACK_BISHOP,
    occupancy
  );
  individualAttackMasks[BLACK_ROOK] = computeMaskForPiece(
    bitboards,
    BLACK_ROOK,
    occupancy
  );
  individualAttackMasks[BLACK_QUEEN] = computeMaskForPiece(
    bitboards,
    BLACK_QUEEN,
    occupancy
  );
};

/**
 * Gets the stored attack mask for a side
 * @param {0 | 1} player - whose mask to get
 * @returns {bigint} - the attack mask
 */
export const getAttackMask = (player) => {
  let mask = 0n;
  if (player === WHITE) {
    for (let p = 0; p < 6; p++) {
      mask |= individualAttackMasks[p];
    }
  } else {
    for (let p = 6; p <= 11; p++) {
      mask |= individualAttackMasks[p];
    }
  }

  return mask;
};
