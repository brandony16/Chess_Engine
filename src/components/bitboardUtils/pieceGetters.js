import { bitScanForward } from "./bbUtils";
import {
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  INITIAL_BITBOARDS,
  NUM_PIECES,
  WHITE,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "./constants";

/**
 * Gets the white piece bitboards
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position. Should have
 * 11 entries, with the first 6 being white pieces, and the next six being black peices
 * @returns {object} white bitboards
 */
export const getWhiteBitboards = (bitboards) => {
  return [
    bitboards[WHITE_PAWN],
    bitboards[WHITE_KNIGHT],
    bitboards[WHITE_BISHOP],
    bitboards[WHITE_ROOK],
    bitboards[WHITE_QUEEN],
    bitboards[WHITE_KING],
  ];
};

/**
 * Gets the white pieces in one bitboard
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position. Should have
 * 11 entries, with the first 6 being white pieces, and the next six being black peices
 * @returns {bigint} all white pieces
 */
export const getWhitePieces = (bitboards) => {
  return (
    bitboards[WHITE_PAWN] |
    bitboards[WHITE_KNIGHT] |
    bitboards[WHITE_BISHOP] |
    bitboards[WHITE_ROOK] |
    bitboards[WHITE_QUEEN] |
    bitboards[WHITE_KING]
  );
};

/**
 * Gets the black piece bitboards.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position. Should have
 * 11 entries, with the first 6 being white pieces, and the next six being black peices
 * @returns {object} black bitboards
 */
export const getBlackBitboards = (bitboards) => {
  return [
    bitboards[BLACK_PAWN],
    bitboards[BLACK_KNIGHT],
    bitboards[BLACK_BISHOP],
    bitboards[BLACK_ROOK],
    bitboards[BLACK_QUEEN],
    bitboards[BLACK_KING],
  ];
};

/**
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current positiion
 * @returns {bigint} all black pieces
 */
export const getBlackPieces = (bitboards) => {
  return (
    bitboards[BLACK_PAWN] |
    bitboards[BLACK_KNIGHT] |
    bitboards[BLACK_BISHOP] |
    bitboards[BLACK_ROOK] |
    bitboards[BLACK_QUEEN] |
    bitboards[BLACK_KING]
  );
};

/**
 * Gets all the pieces on one bitboard
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @returns {bigint} bitboards of all pieces
 */
export const getAllPieces = (bitboards) => {
  return BigInt(getWhitePieces(bitboards) | getBlackPieces(bitboards));
};

/**
 * Gets the bitboard of a specific player's pieces
 *
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @returns bitboard of players pieces
 */
export const getPlayerBoard = (player, bitboards) => {
  return player === WHITE
    ? getWhitePieces(bitboards)
    : getBlackPieces(bitboards);
};

/**
 * Gets all the empty squares
 *
 * @param {BigUint64Array} bitboards - bitboards of the current position
 * @returns {bigint} bitboard of empty squares
 */
export const getEmptySquares = (bitboards) => {
  return ~(getWhitePieces(bitboards) | getBlackPieces(bitboards));
};

export function getPieceAtSquare(square, bitboards) {
  const mask = 1n << BigInt(square);
  for (let piece = 0; piece < NUM_PIECES; piece++) {
    if (bitboards[piece] & mask) {
      return piece;
    }
  }
  return null;
}

/**
 * Array that stores piece locations
 */
export const pieceAt = new Array(64).fill(null);

/**
 * Sets the pieceAt array to have all correct peices for given bitboards
 * @param {BigUint64Array} bitboards - the bitboards of the position
 */
export function initializePieceAtArray(bitboards) {
  clearPieceAtArray();
  for (let piece = 0; piece < NUM_PIECES; piece++) {
    let bb = bitboards[piece];
    while (bb) {
      const sq = bitScanForward(bb);
      pieceAt[sq] = piece;

      bb &= bb - 1n;
    }
  }
}

/**
 * Clears the pieceAt array.
 */
export function clearPieceAtArray() {
  for (let i = 0; i < 64; i++) {
    pieceAt[i] = null;
  }
}
initializePieceAtArray(INITIAL_BITBOARDS);

/**
 * Determines if a given player has a piece at the given square.
 *
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {number} square - the square to find the piece at
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @returns {boolean} true if players piece is at the square
 */
export const isPlayersPieceAtSquare = (player, square, bitboards) => {
  const playerBoard = getPlayerBoard(player, bitboards);

  // Move square to first bit and check if it is one
  return Boolean((playerBoard >> BigInt(square)) & BigInt(1));
};

/**
 * Gets the orthogonal attackers for a player. These are the rook and queen.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {0 | 1} player - the player to get the orthogonal attackers for
 * @returns {bigint} - the bitboard with the orthogonal attackers
 */
export function getOrthAttackersBitboard(bitboards, player) {
  if (player === WHITE) {
    return bitboards[WHITE_ROOK] | bitboards[WHITE_QUEEN];
  }

  return bitboards[BLACK_ROOK] | bitboards[BLACK_QUEEN];
}

/**
 * Gets the diagonal attackers for a player. These are the bishop and queen.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {0 | 1} player - the player to get the diagonal attackers for
 * @returns {bigint} - the bitboard with the diagonal attackers
 */
export function getDiagAttackersBitboard(bitboards, player) {
  if (player === WHITE) {
    return bitboards[WHITE_BISHOP] | bitboards[WHITE_QUEEN];
  }

  return bitboards[BLACK_BISHOP] | bitboards[BLACK_QUEEN];
}