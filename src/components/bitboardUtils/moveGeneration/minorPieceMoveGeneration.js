import {
  FILE_A_MASK,
  FILE_H_MASK,
  RANK_1_MASK,
  RANK_8_MASK,
  WHITE,
} from "../constants";
import { slide } from "../generalHelpers";
import {
  getAllPieces,
  getBlackPieces,
  getEmptySquares,
  getPlayerBoard,
  getWhitePieces,
} from "../pieceGetters";
import { knightMasks } from "../PieceMasks/knightMask";
import { blackPawnMasks, whitePawnMasks } from "../PieceMasks/pawnMask";

/**
 * Gets the move bitboard for a pawn.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - whose piece it is (0 for w, 1 for b)
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

  const isPlayerWhite = player === WHITE;
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
      if ((specificPawn >> 9n) & epMask & FILE_H_MASK) {
        enPassantCapture |= 1n << BigInt(enPassantSquare);
      }
      if ((specificPawn >> 7n) & epMask & FILE_A_MASK) {
        enPassantCapture |= 1n << BigInt(enPassantSquare);
      }
    }
  }

  return singlePush | doublePush | capture | enPassantCapture;
};

/**
 * Gets the move bitboard for a knight.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {number} from - the square its moving from
 * @returns {bigint} the move bitboard for the knight
 */
export const getKnightMovesForSquare = (bitboards, player, from) => {
  // Get raw knight moves
  let moves = knightMasks[from];

  // Get player's pieces to mask out self-captures
  const friendlyPieces = getPlayerBoard(player, bitboards);

  // Remove moves that land on friendly pieces
  return moves & ~friendlyPieces;
};

/**
 * Gets the move bitboard for a bishop.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {number} from - the square its moving from
 * @returns {bigint} the move bitboard for the bishop
 */
export const getBishopMovesForSquare = (bitboards, player, from) => {
  let bishopBitboard = 1n << BigInt(from);
  let moves = 0n;

  // Get occupied squares
  const allPieces = getAllPieces(bitboards);
  const friendlyPieces = getPlayerBoard(player, bitboards);

  moves |= slide(bishopBitboard, 9n, FILE_H_MASK & RANK_8_MASK, allPieces); // Up-right
  moves |= slide(bishopBitboard, 7n, FILE_A_MASK & RANK_8_MASK, allPieces); // Up-left
  moves |= slide(bishopBitboard, -7n, FILE_H_MASK & RANK_1_MASK, allPieces); // Down-right
  moves |= slide(bishopBitboard, -9n, FILE_A_MASK & RANK_1_MASK, allPieces); // Down-left

  return moves & ~friendlyPieces;
};
