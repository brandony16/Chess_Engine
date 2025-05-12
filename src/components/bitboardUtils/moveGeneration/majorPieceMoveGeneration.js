import {
  BLACK,
  FILE_A_MASK,
  FILE_H_MASK,
  RANK_1_MASK,
  RANK_8_MASK,
  WHITE,
} from "../constants";
import { slide } from "../generalHelpers";
import {
  isKingsideCastleLegal,
  isQueensideCastleLegal,
} from "../moveMaking/castleMoveLogic";
import { getAllPieces, getPlayerBoard } from "../pieceGetters";
import { kingMasks } from "../PieceMasks/kingMask";

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
  let moves = kingMasks[from];
  const isPlayerWhite = player === WHITE;

  const friendlyPieces = getPlayerBoard(player, bitboards);

  /* CASTLING */
  if (castlingRights) {
    if (isPlayerWhite) {
      if (
        castlingRights.whiteKingside &&
        isKingsideCastleLegal(WHITE, oppAttackMask)
      ) {
        moves |= 1n << 6n;
      }
      if (
        castlingRights.whiteQueenside &&
        isQueensideCastleLegal(WHITE, oppAttackMask)
      ) {
        moves |= 1n << 2n;
      }
    } else {
      if (
        castlingRights.blackKingside &&
        isKingsideCastleLegal(BLACK, oppAttackMask)
      ) {
        moves |= 1n << 62n;
      }
      if (
        castlingRights.blackQueenside &&
        isQueensideCastleLegal(BLACK, oppAttackMask)
      ) {
        moves |= 1n << 58n;
      }
    }
  }

  // Remove squares occupied by own pieces & those attacked by the enemy
  return moves & ~friendlyPieces & ~oppAttackMask;
};
