import { isSliding } from "../bbUtils.mjs";
import {
  BLACK_BISHOP,
  BLACK_KNIGHT,
  BLACK_QUEEN,
  BLACK_ROOK,
  WHITE,
  WHITE_BISHOP,
  WHITE_KNIGHT,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../constants.mjs";
import { bigIntFullRep } from "../debugFunctions.mjs";
import { getAllPieces } from "../pieceGetters.mjs";
import {
  computeMaskForPiece,
  individualAttackMasks,
} from "./individualAttackMasks.mjs";

/**
 * Updates the individualAttackMasks array with new values based off of the
 * move made.
 * @param {BigUint64Array} bitboards - the new bitboards of the position
 * @param {Move} move - the move that was made.
 */
export const updateAttackMasks = (bitboards, move) => {
  const piece = move.piece;
  const captured = move.captured;
  const promotion = move.promotion;
  const occupancy = getAllPieces(bitboards);

  // Update non sliding pieces affected by the move
  if (!isSliding(piece)) {
    individualAttackMasks[piece] = computeMaskForPiece(piece, occupancy);
  }

  if (captured !== null && !isSliding(captured)) {
    individualAttackMasks[captured] = computeMaskForPiece(captured, occupancy);
  }

  // The only non sliding move that a promotion can be is a knight
  if (promotion === WHITE_KNIGHT || promotion === BLACK_KNIGHT) {
    individualAttackMasks[promotion] = computeMaskForPiece(
      promotion,
      occupancy
    );
  }

  // Recompute sliding pieces to account for blockers
  const sliders = [
    WHITE_BISHOP,
    WHITE_ROOK,
    WHITE_QUEEN,
    BLACK_BISHOP,
    BLACK_ROOK,
    BLACK_QUEEN,
  ];

  const relevantBitMask = getRelevantBitMask(move);
  for (const slider of sliders) {
    updateOneSlidingType(slider, move, occupancy, relevantBitMask);
  }
};

/**
 * Update a single sliding‐piece type by only adjusting the sliders whose attack rays
 * are affected by the move
 *
 * @param {number} piece - the piece to update. Not the same as move.piece
 * @param {Move} move - the move made
 * @param {bigint} occupancy - occupancy bitboard after the move
 * @param {bigint} relevantBitMask - the relevant bit mask for the move 
 */
function updateOneSlidingType(piece, move, occupancy, relevantBitMask) {
  // If the piece is involved in the move, we will need to recompute it.
  if (
    move.captured === piece ||
    move.piece === piece ||
    move.promotion === piece
  ) {
    individualAttackMasks[piece] = computeMaskForPiece(piece, occupancy);
    return;
  }

  // If the pieces attacks are affected by the move, recompute the attacks
  let pieceAttackMask = individualAttackMasks[piece];

  if ((pieceAttackMask & relevantBitMask) === 0n) return;

  individualAttackMasks[piece] = computeMaskForPiece(piece, occupancy);
}

/**
 * Gets the relevant bit mask for a move. The relevant bits are bits that
 * the move directly changes. These are the square the piece moves from,
 * the square it moves to, and the square where a pawn got captured if
 * en passant occured.
 * 
 * @param {Move} move - the move made 
 * @returns {bigint} - the mask of the relevant bits
 */
function getRelevantBitMask(move) {
  let mask = 0n;

  mask |= 1n << BigInt(move.from);
  mask |= 1n << BigInt(move.to);

  if (move.enPassant) {
    // Get the square where the captured pawn was
    const dir = move.piece < 6 ? -8 : +8;
    const epCapturedPawnSquare = move.to + dir;
    mask |= 1n << BigInt(epCapturedPawnSquare);
  }
  return mask;
}

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