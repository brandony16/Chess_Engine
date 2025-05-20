import { bitScanForward } from "../bbUtils";
import {
  BLACK_KING,
  BLACK_QUEEN,
  BLACK_ROOK,
  FILE_A_MASK,
  FILE_H_MASK,
  RANK_1_MASK,
  RANK_8_MASK,
  WHITE,
  WHITE_KING,
  WHITE_QUEEN,
  WHITE_ROOK,
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
import { bishopAttacks } from "./magicBitboards/attackTable";
import { getRookAttacksForSquare } from "./slidingPieceAttacks";

/**
 * Gets the move bitboard for a pawn.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - whose piece it is (0 for w, 1 for b)
 * @param {number} from - the square its moving from
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {bigint} pinnedMask - a bitboard of all of whites pinned pieces
 * @param {function} getRayMask - a function that gets the ray mask for a pinned piece
 * @returns {bigint} the move bitboard for the pawn
 */
export const getPawnMovesForSquare = (
  bitboards,
  player,
  from,
  enPassantSquare,
  pinnedMask,
  getRayMask
) => {
  const specificPawn = 1n << BigInt(from);

  const isWhite = player === WHITE;
  const emptySquares = getEmptySquares(bitboards);
  const enemyPieces = isWhite
    ? getBlackPieces(bitboards)
    : getWhitePieces(bitboards);

  let singlePush = 0n;
  let doublePush = 0n;
  let capture = 0n;
  let enPassantCapture = 0n;

  if (isWhite) {
    singlePush = (specificPawn << 8n) & emptySquares;
    doublePush =
      ((specificPawn & 0x000000000000ff00n) << 16n) &
      emptySquares &
      (emptySquares << 8n);
    capture = whitePawnMasks[from] & enemyPieces;

    // En Passant for white
    if (enPassantSquare !== null) {
      const epMask = 1n << BigInt(enPassantSquare);
      enPassantCapture = whitePawnMasks[from] & epMask;
    }
  } else {
    singlePush = (specificPawn >> 8n) & emptySquares;
    doublePush =
      ((specificPawn & 0x00ff000000000000n) >> 16n) &
      emptySquares &
      (emptySquares >> 8n);
    capture = blackPawnMasks[from] & enemyPieces;

    // En Passant for black
    if (enPassantSquare !== null) {
      const epMask = 1n << BigInt(enPassantSquare);
      enPassantCapture = blackPawnMasks[from] & epMask;
    }
  }

  if (pinnedMask & specificPawn) {
    const pinRay = getRayMask(from);
    singlePush &= pinRay;
    doublePush &= pinRay;
    capture &= pinRay;
    enPassantCapture &= pinRay;
  }

  // En passant captures can put the king in check without being considered "pinned".
  // This can occur when the king is on the same rank as its pawn, and its pawn captures
  // with en passant. This moves the pawn off of the rank, and removes the pawn directly
  // next to it. If an enemy queen or rook is behind this, they will now see the king.
  if (enPassantCapture) {
    const kingSq = bitScanForward(bitboards[isWhite ? WHITE_KING : BLACK_KING]);

    const kingFile = kingSq % 8;
    const kingRow = (kingSq - kingFile) / 8;
    const dr = kingRow - Math.floor(from / 8);

    if (dr === 0) {
      const to = enPassantSquare;
      const capSq = isWhite ? to - 8 : to + 8;
      const capMask = 1n << BigInt(capSq);

      // Remove both the captured and capturee pawns
      const occSansPawns = getAllPieces(bitboards) & ~capMask & ~specificPawn;
      const rookQueen =
        bitboards[isWhite ? BLACK_ROOK : WHITE_ROOK] |
        bitboards[isWhite ? BLACK_QUEEN : WHITE_QUEEN];

      const rAttacks = getRookAttacksForSquare(occSansPawns, kingSq);
      if ((rAttacks & rookQueen) !== 0n) {
        enPassantCapture = 0n;
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
 * @param {bigint} pinnedMask - a bitboard of all of whites pinned pieces
 * @returns {bigint} the move bitboard for the knight
 */
export const getKnightMovesForSquare = (
  bitboards,
  player,
  from,
  pinnedMask
) => {
  // If a knight is pinned, it has no moves
  const knight = 1n << BigInt(from);
  if (knight & pinnedMask) {
    return 0n;
  }

  let moves = knightMasks[from];

  const friendlyPieces = getPlayerBoard(player, bitboards);

  // Remove moves that land on friendly pieces
  return moves & ~friendlyPieces;
};

/**
 * Gets the move bitboard for a bishop.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {number} from - the square its moving from
 * @param {bigint} pinnedMask - a bitboard of all of whites pinned pieces
 * @param {function} getRayMask - a function that gets the ray mask for a pinned piece
 * @returns {bigint} the move bitboard for the bishop
 */
export const getBishopMovesForSquare = (
  bitboards,
  player,
  from,
  pinnedMask,
  getRayMask
) => {
  let bishop = 1n << BigInt(from);
  let moves = 0n;
  // Get occupied squares
  const allPieces = getAllPieces(bitboards);
  const friendlyPieces = getPlayerBoard(player, bitboards);

  moves |= slide(bishop, 9n, FILE_H_MASK & RANK_8_MASK, allPieces); // Up-right
  moves |= slide(bishop, 7n, FILE_A_MASK & RANK_8_MASK, allPieces); // Up-left
  moves |= slide(bishop, -7n, FILE_H_MASK & RANK_1_MASK, allPieces); // Down-right
  moves |= slide(bishop, -9n, FILE_A_MASK & RANK_1_MASK, allPieces); // Down-left

  if (bishop & pinnedMask) {
    const pinRay = getRayMask(from);
    moves &= pinRay;
  }

  return moves & ~friendlyPieces;
};

export const getMagicBishopMovesForSquare = (
  bitboards,
  player,
  from,
  pinnedMask,
  getRayMask
) => {
  // Get occupied squares
  const allPieces = getAllPieces(bitboards);
  const friendlyPieces = getPlayerBoard(player, bitboards);

  let moves = bishopAttacks(from, allPieces);

  let bishop = 1n << BigInt(from);
  if (bishop & pinnedMask) {
    const pinRay = getRayMask(from);
    moves &= pinRay;
  }

  return moves & ~friendlyPieces;
};
