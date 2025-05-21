import {
  BLACK_KING,
  BLACK_KINGSIDE,
  BLACK_QUEENSIDE,
  BLACK_ROOK,
  WHITE,
  WHITE_KING,
  WHITE_KINGSIDE,
  WHITE_QUEENSIDE,
  WHITE_ROOK,
} from "../constants";
import { pieceAt } from "../pieceGetters";

/**
 * Updates castling rights given the square moved from.
 * Does not directly alter the rights array
 *
 * @param {number} from - the square the piece is moving from
 * @param {number} to - the square the piece is moving to
 * @param {Array<boolean>} prevRights - the castling rights
 * @returns {Array<boolean>} the new castling rights
 */
export const updateCastlingRights = (from, to, prevRights) => {
  const newRights = [...prevRights];

  // If a king moves, it loses castling rights
  if (from === 4) {
    newRights[WHITE_KINGSIDE] = false;
    newRights[WHITE_QUEENSIDE] = false;
  } else if (from === 60) {
    newRights[BLACK_KINGSIDE] = false;
    newRights[BLACK_QUEENSIDE] = false;
  }

  // If rooks move or are captured, disable their respective castling
  else if (from === 0 || to === 0) newRights[WHITE_QUEENSIDE] = false;
  else if (from === 7 || to === 7) newRights[WHITE_KINGSIDE] = false;
  else if (from === 56 || to === 56) newRights[BLACK_QUEENSIDE] = false;
  else if (from === 63 || to === 63) newRights[BLACK_KINGSIDE] = false;

  return newRights;
};

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
 * Performs a castling move. Directly alters the given bitboards
 *
 * @param {BigUint64Array} bitboards - The current position's bitboards.
 * @param {number} from - The square the king is moving from.
 * @param {number} to - The square the king is moving to.
 */
export const makeCastleMove = (bitboards, from, to) => {
  if (from === 4 && to === 6) {
    // White kingside castling
    bitboards[WHITE_KING] &= ~(1n << 4n);
    bitboards[WHITE_KING] |= 1n << 6n;
    bitboards[WHITE_ROOK] &= ~(1n << 7n);
    bitboards[WHITE_ROOK] |= 1n << 5n;
    pieceAt[to] = WHITE_KING;
    pieceAt[from] = null;
    pieceAt[7] = null;
    pieceAt[5] = WHITE_ROOK;
  } else if (from === 4 && to === 2) {
    // White queenside castling
    bitboards[WHITE_KING] &= ~(1n << 4n);
    bitboards[WHITE_KING] |= 1n << 2n;
    bitboards[WHITE_ROOK] &= ~(1n << 0n);
    bitboards[WHITE_ROOK] |= 1n << 3n;
    pieceAt[to] = WHITE_KING;
    pieceAt[from] = null;
    pieceAt[0] = null;
    pieceAt[3] = WHITE_ROOK;
  } else if (from === 60 && to === 62) {
    // Black kingside castling
    bitboards[BLACK_KING] &= ~(1n << 60n);
    bitboards[BLACK_KING] |= 1n << 62n;
    bitboards[BLACK_ROOK] &= ~(1n << 63n);
    bitboards[BLACK_ROOK] |= 1n << 61n;
    pieceAt[to] = BLACK_KING;
    pieceAt[from] = null;
    pieceAt[63] = null;
    pieceAt[61] = BLACK_ROOK;
  } else if (from === 60 && to === 58) {
    // Black queenside castling
    bitboards[BLACK_KING] &= ~(1n << 60n);
    bitboards[BLACK_KING] |= 1n << 58n;
    bitboards[BLACK_ROOK] &= ~(1n << 56n);
    bitboards[BLACK_ROOK] |= 1n << 59n;
    pieceAt[to] = BLACK_KING;
    pieceAt[from] = null;
    pieceAt[56] = null;
    pieceAt[59] = BLACK_ROOK;
  }
};

/**
 * Undoes a castling move. Directly alters the given bitboards
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
    pieceAt[from] = WHITE_KING;
    pieceAt[to] = null;
    pieceAt[5] = null;
    pieceAt[7] = WHITE_ROOK;
  } else if (from === 4 && to === 2) {
    // White queenside castling
    bitboards[WHITE_KING] &= ~(1n << 2n);
    bitboards[WHITE_KING] |= 1n << 4n;
    bitboards[WHITE_ROOK] &= ~(1n << 3n);
    bitboards[WHITE_ROOK] |= 1n << 0n;
    pieceAt[from] = WHITE_KING;
    pieceAt[to] = null;
    pieceAt[3] = null;
    pieceAt[0] = WHITE_ROOK;
  } else if (from === 60 && to === 62) {
    // Black kingside castling
    bitboards[BLACK_KING] &= ~(1n << 62n);
    bitboards[BLACK_KING] |= 1n << 60n;
    bitboards[BLACK_ROOK] &= ~(1n << 61n);
    bitboards[BLACK_ROOK] |= 1n << 63n;
    pieceAt[from] = BLACK_KING;
    pieceAt[to] = null;
    pieceAt[61] = null;
    pieceAt[63] = BLACK_ROOK;
  } else if (from === 60 && to === 58) {
    // Black queenside castling
    bitboards[BLACK_KING] &= ~(1n << 58n);
    bitboards[BLACK_KING] |= 1n << 60n;
    bitboards[BLACK_ROOK] &= ~(1n << 59n);
    bitboards[BLACK_ROOK] |= 1n << 56n;
    pieceAt[from] = BLACK_KING;
    pieceAt[to] = null;
    pieceAt[59] = null;
    pieceAt[56] = BLACK_ROOK;
  }
};
