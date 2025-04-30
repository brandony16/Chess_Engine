/**
 * @typedef {BigUint64Array} Bitboards
 * @property {bigint} whitePawns - bitboard of the white pawns
 * @property {bigint} whiteKnights - bitboard of the white knights
 * @property {bigint} whiteBishops - bitboard of the white bishops
 * @property {bigint} whiteRooks - bitboard of the white rooks
 * @property {bigint} whiteQueens - bitboard of the white queens
 * @property {bigint} whiteKings - bitboard of the white king
 * @property {bigint} blackPawns - bitboard of the black pawns
 * @property {bigint} blackKnights - bitboard of the black knights
 * @property {bigint} blackBishops - bitboard of the black bishops
 * @property {bigint} blackRooks - bitboard of the black rooks
 * @property {bigint} blackQueens - bitboard of the black queens
 * @property {bigint} blackKings - bitboard of the black king
 */

import { NUM_PIECES } from "./constants";

/**
 * Gets the white piece bitboards
 *
 * @param {Bitboards} bitboards - the bitboards of the current position. Should have
 * 11 entries, with the first 6 being white pieces, and the next six being black peices
 * @returns {object} white bitboards
 */
export const getWhiteBitboards = (bitboards) => {
  return [
    bitboards[0],
    bitboards[1],
    bitboards[2],
    bitboards[3],
    bitboards[4],
    bitboards[5],
  ];
};

/**
 * Gets the white pieces in one bitboard
 *
 * @param {Bitboards} bitboards - the bitboards of the current position. Should have
 * 11 entries, with the first 6 being white pieces, and the next six being black peices
 * @returns {bigint} all white pieces
 */
export const getWhitePieces = (bitboards) => {
  return (
    bitboards[0] |
    bitboards[1] |
    bitboards[2] |
    bitboards[3] |
    bitboards[4] |
    bitboards[5]
  );
};

/**
 * Gets the black piece bitboards. 
 *
 * @param {Bitboards} bitboards - the bitboards of the current position. Should have
 * 11 entries, with the first 6 being white pieces, and the next six being black peices
 * @returns {object} black bitboards
 */
export const getBlackBitboards = (bitboards) => {
  return [
    bitboards[6],
    bitboards[7],
    bitboards[8],
    bitboards[9],
    bitboards[10],
    bitboards[11],
  ];
};

/**
 *
 * @param {Bitboards} bitboards - the bitboards of the current positiion
 * @returns {bigint} all black pieces
 */
export const getBlackPieces = (bitboards) => {
  return (
    bitboards[6] |
    bitboards[7] |
    bitboards[8] |
    bitboards[9] |
    bitboards[10] |
    bitboards[11]
  );
};

/**
 * Gets all the pieces on one bitboard
 *
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @returns {bigint} bitboards of all pieces
 */
export const getAllPieces = (bitboards) => {
  return BigInt(getWhitePieces(bitboards) | getBlackPieces(bitboards));
};

/**
 * Gets the bitboard of a specific player's pieces
 *
 * @param {string} player - the player whose move it is ("w" or "b")
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @returns bitboard of players pieces
 */
export const getPlayerBoard = (player, bitboards) => {
  return player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);
};

/**
 * Gets all the empty squares
 *
 * @param {Bitboards} bitboards - bitboards of the current position
 * @returns {bigint} bitboard of empty squares
 */
export const getEmptySquares = (bitboards) => {
  return ~(getWhitePieces(bitboards) | getBlackPieces(bitboards));
};

/**
 * Gets a piece at a specific square
 *
 * @param {number} square - the square to find the piece at
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @returns {string} piece at the square
 */
export const getPieceAtSquare = (square, bitboards) => {
  const mask = 1n << BigInt(square);
  for (let p = 0; p < NUM_PIECES; p++) {
    if ((bitboards[p] & mask) !== 0n) {
      return p;  
    }
  }
  return null; // empty square
};

/**
 * Determines if a given player has a piece at the given square.
 *
 * @param {string} player - the player whose move it is ("w" or "b")
 * @param {number} square - the square to find the piece at
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @returns {boolean} true if players piece is at the square
 */
export const isPlayersPieceAtSquare = (player, square, bitboards) => {
  const playerBoard = getPlayerBoard(player, bitboards);

  // Move square to first bit and check if it is one
  return Boolean((playerBoard >> BigInt(square)) & BigInt(1));
};
