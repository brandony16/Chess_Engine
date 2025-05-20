import { bitScanForward } from "../bbUtils";
import {
  BLACK,
  BLACK_BISHOP,
  BLACK_QUEEN,
  BLACK_ROOK,
  FILE_A_MASK,
  FILE_H_MASK,
  RANK_1_MASK,
  RANK_8_MASK,
  WHITE,
  WHITE_BISHOP,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../constants";
import { slide } from "../generalHelpers";
import {
  isKingsideCastleLegal,
  isQueensideCastleLegal,
} from "../moveMaking/castleMoveLogic";
import { getAllPieces, getPlayerBoard } from "../pieceGetters";
import { kingMasks } from "../PieceMasks/kingMask";
import { bishopAttacks, rookAttacks } from "./magicBitboards/attackTable";
import {
  getBishopAttacksForSquare,
  getRookAttacksForSquare,
} from "./slidingPieceAttacks";

/**
 * Gets the move bitboard for a rook.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {number} from - the square its moving from
 * @param {bigint} pinnedMask - a bitboard of all of whites pinned pieces
 * @param {function} getRayMask - a function that gets the ray mask for a pinned piece
 * @returns {bigint} the move bitboard for the rook
 */
export const getRookMovesForSquare = (
  bitboards,
  player,
  from,
  pinnedMask,
  getRayMask
) => {
  let rook = 1n << BigInt(from);
  let moves = 0n;

  const allPieces = getAllPieces(bitboards);
  const friendlyPieces = getPlayerBoard(player, bitboards);

  moves |= slide(rook, 1n, FILE_H_MASK, allPieces);
  moves |= slide(rook, -1n, FILE_A_MASK, allPieces);
  moves |= slide(rook, 8n, RANK_8_MASK, allPieces);
  moves |= slide(rook, -8n, RANK_1_MASK, allPieces);

  if (rook & pinnedMask) {
    const mask = getRayMask(from);
    moves &= mask;
  }

  return moves & ~friendlyPieces;
};

export const getMagicRookMovesForSquare = (
  bitboards,
  player,
  from,
  pinnedMask,
  getRayMask
) => {
  const allPieces = getAllPieces(bitboards);
  const friendlyPieces = getPlayerBoard(player, bitboards);

  let moves = rookAttacks(from, allPieces);

  let rook = 1n << BigInt(from);
  if (rook & pinnedMask) {
    const mask = getRayMask(from);
    moves &= mask;
  }

  return moves & ~friendlyPieces;
};

/**
 * Gets the move bitboard for a queen.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {number} from - the square its moving from
 * @param {bigint} pinnedMask - a bitboard of all of whites pinned pieces
 * @param {function} getRayMask - a function that gets the ray mask for a pinned piece
 * @returns {bigint} the move bitboard for the queen
 */
export const getQueenMovesForSquare = (
  bitboards,
  player,
  from,
  pinnedMask,
  getRayMask
) => {
  let queen = 1n << BigInt(from);
  let moves = 0n;

  const allPieces = getAllPieces(bitboards);
  const friendlyPieces = getPlayerBoard(player, bitboards);

  // Orthogonal Moves
  moves |= slide(queen, 1n, FILE_H_MASK, allPieces); // Right
  moves |= slide(queen, -1n, FILE_A_MASK, allPieces); // Left
  moves |= slide(queen, 8n, RANK_8_MASK, allPieces); // Up
  moves |= slide(queen, -8n, RANK_1_MASK, allPieces); // Down

  // Diagonal Moves
  moves |= slide(queen, 9n, FILE_H_MASK & RANK_8_MASK, allPieces); // Up-right
  moves |= slide(queen, 7n, FILE_A_MASK & RANK_8_MASK, allPieces); // Up-left
  moves |= slide(queen, -7n, FILE_H_MASK & RANK_1_MASK, allPieces); // Down-right
  moves |= slide(queen, -9n, FILE_A_MASK & RANK_1_MASK, allPieces); // Down-left

  if (queen & pinnedMask) {
    const mask = getRayMask(from);
    moves &= mask;
  }

  return moves & ~friendlyPieces;
};

export const getMagicQueenMovesForSquare = (
  bitboards,
  player,
  from,
  pinnedMask,
  getRayMask
) => {
  const allPieces = getAllPieces(bitboards);
  const friendlyPieces = getPlayerBoard(player, bitboards);
  
  let moves = bishopAttacks(from, allPieces) | rookAttacks(from, allPieces);
  
  let queen = 1n << BigInt(from);
  if (queen & pinnedMask) {
    const mask = getRayMask(from);
    moves &= mask;
  }

  return moves & ~friendlyPieces;
};

/**
 * Gets the move bitboard for a king.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {number} from - the square its moving from
 * @param {bigint} oppAttackMask - the opponents attack mask
 * @param {CastlingRights} castlingRights - the castling rights for the king
 * @returns {bigint} the move bitboard for the king
 */
export const getKingMovesForSquare = (
  bitboards,
  player,
  from,
  oppAttackMask,
  castlingRights = null
) => {
  const friendlyPieces = getPlayerBoard(player, bitboards);
  let moves = kingMasks[from] & ~friendlyPieces;
  const isWhite = player === WHITE;

  const occupancy = getAllPieces(bitboards);

  /* CASTLING */
  if (castlingRights) {
    if (isWhite) {
      if (
        castlingRights.whiteKingside &&
        isKingsideCastleLegal(WHITE, oppAttackMask, occupancy)
      ) {
        moves |= 1n << 6n;
      }
      if (
        castlingRights.whiteQueenside &&
        isQueensideCastleLegal(WHITE, oppAttackMask, occupancy)
      ) {
        moves |= 1n << 2n;
      }
    } else {
      if (
        castlingRights.blackKingside &&
        isKingsideCastleLegal(BLACK, oppAttackMask, occupancy)
      ) {
        moves |= 1n << 62n;
      }
      if (
        castlingRights.blackQueenside &&
        isQueensideCastleLegal(BLACK, oppAttackMask, occupancy)
      ) {
        moves |= 1n << 58n;
      }
    }
  }

  const kingMask = 1n << BigInt(from);
  if (kingMask & oppAttackMask) {
    let dest = moves;
    while (dest) {
      const to = bitScanForward(dest);
      const toMask = 1n << BigInt(to);
      dest &= dest - 1n;

      let occ2 = occupancy;

      // Move king to new square
      occ2 &= ~kingMask;
      occ2 |= toMask;

      const orthAttacks =
        getRookAttacksForSquare(occ2, to) &
        (isWhite
          ? bitboards[BLACK_ROOK] | bitboards[BLACK_QUEEN]
          : bitboards[WHITE_ROOK] | bitboards[WHITE_QUEEN]);
      const diagAttacks =
        getBishopAttacksForSquare(occ2, to) &
        (isWhite
          ? bitboards[BLACK_BISHOP] | bitboards[BLACK_QUEEN]
          : bitboards[WHITE_BISHOP] | bitboards[WHITE_QUEEN]);

      if (orthAttacks || diagAttacks) {
        moves &= ~toMask;
      }
    }
  }

  // Remove squares attacked by the enemy
  return moves & ~oppAttackMask;
};
