/**
 * @typedef {object} Bitboards
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

import {
  FILE_A_MASK,
  FILE_H_MASK,
  RANK_1_MASK,
  RANK_8_MASK,
} from "../constants";
import { slide } from "../generalHelpers";
import {
  getAllPieces,
  getBlackPieces,
  getEmptySquares,
  getWhitePieces,
} from "../pieceGetters";
import { knightMasks } from "../PieceMasks/knightMask";
import { blackPawnMasks, whitePawnMasks } from "../PieceMasks/pawnMask";

/**
 * Gets the move bitboard for a pawn.
 * @param {Bitboards} bitboards - the bitboards in the current position
 * @param {string} player - whose piece it is ("w" or "b")
 * @param {number} from - the square its moving from
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {boolean} attacksOnly - whether to only count attacking moves.
 * @returns {bigint} the move bitboard for the pawn
 */
export const getPawnMovesForSquare = (
  bitboards,
  player,
  from,
  enPassantSquare,
  attacksOnly = false
) => {
  const specificPawn = 1n << BigInt(from);

  const isPlayerWhite = player === "w";
  const emptySquares = getEmptySquares(bitboards);
  const enemyPieces = isPlayerWhite
    ? getBlackPieces(bitboards)
    : getWhitePieces(bitboards);

  let singlePush = 0n;
  let doublePush = 0n;
  let capture = 0n;
  let enPassantCapture = 0n;

  if (isPlayerWhite) {
    if (!attacksOnly) {
      singlePush = (specificPawn << 8n) & emptySquares;
      doublePush =
        ((specificPawn & 0x000000000000ff00n) << 16n) &
        emptySquares &
        (emptySquares << 8n);
    }
    capture = whitePawnMasks[from] & enemyPieces;

    // En Passant for white
    if (enPassantSquare !== null) {
      const epMask = 1n << BigInt(enPassantSquare);
      if ((specificPawn << 7n) & epMask) {
        enPassantCapture |= 1n << BigInt(enPassantSquare);
      }
      if ((specificPawn << 9n) & epMask) {
        enPassantCapture |= 1n << BigInt(enPassantSquare);
      }
    }
  } else {
    if (!attacksOnly) {
      singlePush = (specificPawn >> 8n) & emptySquares;
      doublePush =
        ((specificPawn & 0x00ff000000000000n) >> 16n) &
        emptySquares &
        (emptySquares >> 8n);
    }
    capture = blackPawnMasks[from] & enemyPieces;

    // En Passant for black
    if (enPassantSquare !== null) {
      const epMask = 1n << BigInt(enPassantSquare);
      if ((specificPawn >> 9n) & epMask) {
        enPassantCapture |= 1n << BigInt(enPassantSquare);
      }
      if ((specificPawn >> 7n) & epMask) {
        enPassantCapture |= 1n << BigInt(enPassantSquare);
      }
    }
  }

  return singlePush | doublePush | capture | enPassantCapture;
};

/**
 * Gets the move bitboard for a knight.
 * @param {Bitboards} bitboards - the bitboards in the current position
 * @param {string} player - whose piece it is ("w" or "b")
 * @param {number} from - the square its moving from
 * @returns {bigint} the move bitboard for the knight
 */
export const getKnightMovesForSquare = (bitboards, player, from) => {
  // Get raw knight moves
  let moves = knightMasks[from];

  // Get player's pieces to mask out self-captures
  const friendlyPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  // Remove moves that land on friendly pieces
  return moves & ~friendlyPieces;
};

/**
 * Gets the move bitboard for a bishop.
 * @param {Bitboards} bitboards - the bitboards in the current position
 * @param {string} player - whose piece it is ("w" or "b")
 * @param {number} from - the square its moving from
 * @returns {bigint} the move bitboard for the bishop
 */
export const getBishopMovesForSquare = (bitboards, player, from) => {
  let bishopBitboard = 1n << BigInt(from);
  let moves = 0n;

  // Get occupied squares
  const allPieces = getAllPieces(bitboards);
  const friendlyPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  moves |= slide(bishopBitboard, 9n, FILE_H_MASK & RANK_8_MASK, allPieces); // Up-right
  moves |= slide(bishopBitboard, 7n, FILE_A_MASK & RANK_8_MASK, allPieces); // Up-left
  moves |= slide(bishopBitboard, -7n, FILE_H_MASK & RANK_1_MASK, allPieces); // Down-right
  moves |= slide(bishopBitboard, -9n, FILE_A_MASK & RANK_1_MASK, allPieces); // Down-left

  return moves & ~friendlyPieces;
};
