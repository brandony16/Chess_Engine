import { isSquareAttacked } from "../bbChessLogic";
import { isKing } from "../bbUtils";
import {
  BLACK,
  BLACK_KING,
  BLACK_ROOK,
  WHITE,
  WHITE_KING,
  WHITE_ROOK,
} from "../constants";
import { getPieceAtSquare } from "../pieceGetters";

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
 * @param {CastlingRights} prevRights - the rights to update. Has fields whiteKingside, whiteQueenside, blackKingside, blackQueenside
 * @returns {CastlingRights} the new castling rights
 */
export const updateCastlingRights = (from, prevRights) => {
  const newRights = { ...prevRights };

  // If a king moves, it loses castling rights
  if (from === 4) {
    newRights.whiteKingside = false;
    newRights.whiteQueenside = false;
  } else if (from === 60) {
    newRights.blackKingside = false;
    newRights.blackQueenside = false;
  }

  // If rooks move, disable their respective castling
  else if (from === 0) newRights.whiteQueenside = false;
  else if (from === 7) newRights.whiteKingside = false;
  else if (from === 56) newRights.blackQueenside = false;
  else if (from === 63) newRights.blackKingside = false;

  return newRights;
};

/* CASTLING FUNCTIONS */
/**
 * Determines whether a given player can castle kingside
 *
 * @param {BigUint64Array} bitboards - the current positions bitboards
 * @param {number} player - the player who is castling (0 for w, 1 for b)
 * @param {bigint} attackHash - the attack hash for the player
 * @returns {boolean} whether the player can castle kingside
 */
export const isKingsideCastleLegal = (bitboards, player, attackHash) => {
  let squares;
  let opponent;
  if (player === WHITE) {
    squares = [4, 5, 6];
    opponent = BLACK;
  } else {
    squares = [60, 61, 62];
    opponent = WHITE;
  }

  // Check if squares are empty or under attack
  for (let square of squares) {
    const piece = getPieceAtSquare(square, bitboards);
    if (piece !== null && !isKing(piece)) {
      return false;
    }
    if (isSquareAttacked(bitboards, square, opponent, attackHash)) {
      return false;
    }
  }

  return true;
};

/**
 * Determines whether a given player can castle queenside
 *
 * @param {BigUint64Array} bitboards - the current positions bitboards
 * @param {string} player - the player who is castling ("w" or "b")
 * @param {bigint} attackHash - the attack hash for the player
 * @returns {boolean} whether the player can castle queenside
 */
export const isQueensideCastleLegal = (bitboards, player, attackHash) => {
  let squares;
  let opponent;
  if (player === WHITE) {
    squares = [2, 3, 4];
    opponent = BLACK;
  } else {
    squares = [58, 59, 60];
    opponent = WHITE;
  }

  // Check if squares are empty or under attack
  for (let square of squares) {
    const piece = getPieceAtSquare(square, bitboards);
    if (piece !== null && !isKing(piece)) {
      return false;
    }
    if (isSquareAttacked(bitboards, square, opponent, attackHash)) {
      return false;
    }
  }

  return true;
};

/**
 * Executes a castling move and returns updated game state.
 *
 * @param {BigUint64Array} bitboards - The current position's bitboards.
 * @param {number} from - The square the king is moving from.
 * @param {number} to - The square the king is moving to.
 * @returns {MoveResult} An object containing the updated bitboards, null for enPassantSquare,and false for isCapture.
 */
export const makeCastleMove = (bitboards, from, to) => {
  let newBitboards = [...bitboards];

  if (from === 4 && to === 6) {
    // White kingside castling
    newBitboards[WHITE_KING] &= ~(1n << 4n);
    newBitboards[WHITE_KING] |= 1n << 6n;
    newBitboards[WHITE_ROOK] &= ~(1n << 7n);
    newBitboards[WHITE_ROOK] |= 1n << 5n;
  } else if (from === 4 && to === 2) {
    // White queenside castling
    newBitboards[WHITE_KING] &= ~(1n << 4n);
    newBitboards[WHITE_KING] |= 1n << 2n;
    newBitboards[WHITE_ROOK] &= ~(1n << 0n);
    newBitboards[WHITE_ROOK] |= 1n << 3n;
  } else if (from === 60 && to === 62) {
    // Black kingside castling
    newBitboards[BLACK_KING] &= ~(1n << 60n);
    newBitboards[BLACK_KING] |= 1n << 62n;
    newBitboards[BLACK_ROOK] &= ~(1n << 63n);
    newBitboards[BLACK_ROOK] |= 1n << 61n;
  } else if (from === 60 && to === 58) {
    // Black queenside castling
    newBitboards[BLACK_KING] &= ~(1n << 60n);
    newBitboards[BLACK_KING] |= 1n << 58n;
    newBitboards[BLACK_ROOK] &= ~(1n << 56n);
    newBitboards[BLACK_ROOK] |= 1n << 59n;
  }
  return { bitboards: newBitboards, enPassantSquare: null, isCapture: false };
};

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
