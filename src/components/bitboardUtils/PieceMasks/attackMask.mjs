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
import { getAllPieces } from "../pieceGetters.mjs";
import { indexArrays } from "../pieceIndicies.mjs";
import {
  computeMaskForPiece,
  individualAttackMasks,
} from "./individualAttackMasks.mjs";

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
  if (!isSliding(piece)) {
    individualAttackMasks[piece] = computeMaskForPiece(piece, occupancy);
  }

  if (captured !== null && !isSliding(captured)) {
    individualAttackMasks[captured] = computeMaskForPiece(captured, occupancy);
  }

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

  for (const slider of sliders) {
    individualAttackMasks[slider] = computeMaskForPiece(slider, occupancy);

    // updateOneSlidingType(slider, move, occupancy);
  }
};

/**
 * Updates the individualAttackMasks array with new values based off of the
 * move made.
 * @param {BigUint64Array} bitboards - the new bitboards of the position
 * @param {Move} move - the move that was made.
 */
export const undoAttackMaskUpdate = (bitboards, move) => {
  const piece = move.piece;
  const captured = move.captured;
  const promotion = move.promotion;
  const occupancy = getAllPieces(bitboards);

  // Remove old attacks of the piece
  if (!isSliding(piece)) {
    individualAttackMasks[piece] = computeMaskForPiece(piece, occupancy);
  }

  if (captured !== null && !isSliding(captured)) {
    individualAttackMasks[captured] = computeMaskForPiece(captured, occupancy);
  }

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

  for (const slider of sliders) {
    individualAttackMasks[slider] = computeMaskForPiece(slider, occupancy);

    // undoOneSlidingTypeUpdate(slider, move, occupancy);
  }
};

/**
 * Update a single sliding‐piece type by only adjusting the sliders whose attack rays
 * cross move.from or move.to.
 *
 * @param {number} piece - the piece to update. Not necessarily the same as move.piece
 * @param {Move} move - the move made
 * @param {bigint} occupancy - occupancy bitboard after the move
 */
function updateOneSlidingType(piece, move, occupancy) {
  let pieceAttackMask = individualAttackMasks[piece];
  if (move.captured === piece) {
    individualAttackMasks[piece] = computeMaskForPiece(piece, occupancy);
  }

  const relevantBitMask = getRelevantBitMask(move);

  if ((pieceAttackMask & relevantBitMask) === 0n) return;

  individualAttackMasks[piece] = computeMaskForPiece(piece, occupancy);
}

function getRelevantBitMask(move) {
  let mask = 0n;

  mask |= 1n << BigInt(move.from);
  mask |= 1n << BigInt(move.to);

  if (move.enPassant) {
    const dir = move.piece > 6 ? +8 : -8;
    const epCapturedPawnSquare = move.to + dir;
    mask |= 1n << BigInt(epCapturedPawnSquare);
  }
  return mask;
}

/**
 * Update a single sliding‐piece type by only adjusting the sliders whose attack rays
 * cross move.from or move.to.
 *
 * @param {number} piece - the piece to update. Not necessarily the same as move.piece
 * @param {Move} move - the move made
 * @param {bigint} oldOccupancy - occupancy bitboard before the move
 * @param {bigint} newOccupancy - occupancy bitboard after the move
 */
function undoOneSlidingTypeUpdate(piece, move, occupancy) {
  let pieceAttackMask = individualAttackMasks[piece];
  if (move.captured === piece) {
    individualAttackMasks[piece] = computeMaskForPiece(piece, occupancy);
  }

  const relevantBitMask = getRelevantBitMask(move);

  if ((pieceAttackMask & relevantBitMask) === 0n) return;

  individualAttackMasks[piece] = computeMaskForPiece(piece, occupancy);
}

function isOnEnPassantRay(piece, move) {
  if (!move.enPassant) return false;

  const dir = move.piece > 6 ? +8 : -8;
  const enPassantCapturedPieceSquare = move.to + dir;
  for (const sq of indexArrays[piece]) {
    if (onSameRay(enPassantCapturedPieceSquare, sq)) {
      return true;
    }
  }
  return false;
}

/**
 * Helper to determine if two squares are on the same ray.
 *
 * @param {number} sq1 - one of the squares
 * @param {number} sq2 - the other square
 * @returns {boolean} - if they are on the same ray
 */
function onSameRay(sq1, sq2) {
  const f1 = sq1 & 7,
    r1 = sq1 >> 3;
  const f2 = sq2 & 7,
    r2 = sq2 >> 3;
  // same rank or same file?
  if (f1 === f2 || r1 === r2) return true;
  // same diagonal?
  if (Math.abs(f1 - f2) === Math.abs(r1 - r2)) return true;
  return false;
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

function getOldSquares(piece, move) {
  const didSlidingMove = piece === move.piece;
  const wasCaptured = piece === move.captured;
  const indexArray = indexArrays[piece];

  if (didSlidingMove) return [move.from];
  if (wasCaptured) return [...indexArray, move.to];
  if (rookMovedInCastle(piece, move)) return getOldRookSquares(move);

  return indexArray.slice();
}

function getUndoOldSquares(piece, move) {
  const didSlidingMove = piece === move.piece;
  const wasCaptured = piece === move.captured;
  const wasPromotion = piece === move.promotion;
  const indexArray = indexArrays[piece];

  if (didSlidingMove) return [move.to];
  if (wasCaptured || wasPromotion) return [...indexArray, move.to];
  if (rookMovedInCastle(piece, move)) return getOldUndoRookSquares(move);

  return indexArray.slice();
}

function rookMovedInCastle(piece, move) {
  if (!move.castling) return false;

  if (move.from === 4 && piece === WHITE_ROOK) {
    return true;
  }
  return move.from === 60 && piece === BLACK_ROOK;
}

function getOldRookSquares(move) {
  if (!move.castling) throw new Error("Not a castling move");

  // Kingside castling
  if (move.from < move.to) {
    return [move.to + 1];
  }
  return [move.to - 2];
}

function getOldUndoRookSquares(move) {
  if (!move.castling) throw new Error("Not a castling move");

  // Kingside castling
  if (move.from < move.to) {
    return [move.from + 1];
  }
  return [move.from - 1];
}
