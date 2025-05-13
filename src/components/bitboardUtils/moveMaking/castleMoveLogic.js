import {
  BLACK_KING,
  BLACK_ROOK,
  WHITE,
  WHITE_KING,
  WHITE_ROOK,
} from "../constants";
import { bigIntFullRep } from "../generalHelpers";

/**
 * @typedef {object} CastlingRights
 * @property {boolean} whiteKingside - Whether castling kingside is legal for white
 * @property {boolean} whiteQueenside - Whether castling queenside is legal for white
 * @property {boolean} blackKingside - Whether castling kingside is legal for black
 * @property {boolean} blackQueenside - Whether castling queenside is legal for black
 */

/**
 * @typedef {Object} MoveResult
 * @property {object} bitboards - The updated bitboards after the move
 * @property {number} enPassantSquare - The square where enPassant is legal
 * @property {boolean} isCapture - Whether the move was a capture
 */

/**
 * Updates castling rights given the square moved from. If any rook or king moves, castling is updated.
 * Because they always start at squares 0, 4, 7, 56, 60, and 63; any move from these squares means the rights need to be updated.
 *
 * @param {number} from - the square the piece is moving from
 * @param {number} to - the square the piece is moving to
 * @param {CastlingRights} prevRights - the rights to update. Has fields whiteKingside, whiteQueenside, blackKingside, blackQueenside
 * @returns {CastlingRights} the new castling rights
 */
export const updateCastlingRights = (from, to, prevRights) => {
  const newRights = { ...prevRights };

  // If a king moves, it loses castling rights
  if (from === 4) {
    newRights.whiteKingside = false;
    newRights.whiteQueenside = false;
  } else if (from === 60) {
    newRights.blackKingside = false;
    newRights.blackQueenside = false;
  }

  // If rooks move or are captured, disable their respective castling
  else if (from === 0 || to === 0) newRights.whiteQueenside = false;
  else if (from === 7 || to === 7) newRights.whiteKingside = false;
  else if (from === 56 || to === 56) newRights.blackQueenside = false;
  else if (from === 63 || to === 63) newRights.blackKingside = false;

  return newRights;
};

/* CASTLING FUNCTIONS */
/**
 * Determines whether a given player can castle kingside
 *
 * @param {number} player - the player who is castling (0 for w, 1 for b)
 * @param {bigint} attackMask - the attack mask for the other player
 * @param {bigint} occ - the occupancy bitboard
 * @returns {boolean} whether the player can castle kingside
 */
export const isKingsideCastleLegal = (player, attackMask, occ) => {
  let squares;
  if (player === WHITE) {
    squares = [4, 5, 6];
  } else {
    squares = [60, 61, 62];
  }

  for (const square of squares) {
    const mask = 1n << BigInt(square);
    // Square isnt attacked
    if (attackMask & mask) {
      return false;
    }

    // Square isnt occupied, unless its the king square
    if (mask & occ && (player === WHITE ? square !== 4 : square !== 60)) {
      return false;
    }
  }

  return true;
};

/**
 * Determines whether a given player can castle queenside
 *
 * @param {number} player - the player who is castling (0 for w, 1 for b)
 * @param {bigint} attackMask - the attack mask for the other player
 * @param {bigint} occ - the occupancy bitboard
 * @returns {boolean} whether the player can castle queenside
 */
export const isQueensideCastleLegal = (player, attackMask, occ) => {
  let squares;
  if (player === WHITE) {
    squares = [2, 3, 4];
  } else {
    squares = [58, 59, 60];
  }

  for (const square of squares) {
    const mask = 1n << BigInt(square);
    // Square isnt attacked
    if (attackMask & mask) {
      return false;
    }

    // Square isnt occupied, unless its the king square
    if (mask & occ && (player === WHITE ? square !== 4 : square !== 60)) {
      return false;
    }
  }

  return true;
};

/**
 * Performs a castling move.
 *
 * @param {BigUint64Array} bitboards - The current position's bitboards.
 * @param {number} from - The square the king is moving from.
 * @param {number} to - The square the king is moving to.
 */
export const updatedMakeCastleMove = (bitboards, from, to) => {
  if (from === 4 && to === 6) {
    // White kingside castling
    bitboards[WHITE_KING] &= ~(1n << 4n);
    bitboards[WHITE_KING] |= 1n << 6n;
    bitboards[WHITE_ROOK] &= ~(1n << 7n);
    bitboards[WHITE_ROOK] |= 1n << 5n;
  } else if (from === 4 && to === 2) {
    // White queenside castling
    bitboards[WHITE_KING] &= ~(1n << 4n);
    bitboards[WHITE_KING] |= 1n << 2n;
    bitboards[WHITE_ROOK] &= ~(1n << 0n);
    bitboards[WHITE_ROOK] |= 1n << 3n;
  } else if (from === 60 && to === 62) {
    // Black kingside castling
    bitboards[BLACK_KING] &= ~(1n << 60n);
    bitboards[BLACK_KING] |= 1n << 62n;
    bitboards[BLACK_ROOK] &= ~(1n << 63n);
    bitboards[BLACK_ROOK] |= 1n << 61n;
  } else if (from === 60 && to === 58) {
    // Black queenside castling
    bitboards[BLACK_KING] &= ~(1n << 60n);
    bitboards[BLACK_KING] |= 1n << 58n;
    bitboards[BLACK_ROOK] &= ~(1n << 56n);
    bitboards[BLACK_ROOK] |= 1n << 59n;
  }
};

/**
 * Undoes a castling move.
 *
 * @param {BigUint64Array} bitboards - The current position's bitboards.
 * @param {number} from - The square the king is moving from.
 * @param {number} to - The square the king is moving to.
 */
export const unMakeCastleMove = (bitboards, from, to) => {
  if (from === 4 && to === 6) {
    // White kingside castling
    bitboards[WHITE_KING] &= ~(1n << 6n);
    bitboards[WHITE_KING] |= 1n << 4n;
    bitboards[WHITE_ROOK] &= ~(1n << 5n);
    bitboards[WHITE_ROOK] |= 1n << 7n;
  } else if (from === 4 && to === 2) {
    // White queenside castling
    bitboards[WHITE_KING] &= ~(1n << 2n);
    bitboards[WHITE_KING] |= 1n << 4n;
    bitboards[WHITE_ROOK] &= ~(1n << 3n);
    bitboards[WHITE_ROOK] |= 1n << 0n;
  } else if (from === 60 && to === 62) {
    // Black kingside castling
    bitboards[BLACK_KING] &= ~(1n << 62n);
    bitboards[BLACK_KING] |= 1n << 60n;
    bitboards[BLACK_ROOK] &= ~(1n << 61n);
    bitboards[BLACK_ROOK] |= 1n << 63n;
  } else if (from === 60 && to === 58) {
    // Black queenside castling
    bitboards[BLACK_KING] &= ~(1n << 58n);
    bitboards[BLACK_KING] |= 1n << 60n;
    bitboards[BLACK_ROOK] &= ~(1n << 59n);
    bitboards[BLACK_ROOK] |= 1n << 56n;
  }
};
