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
 * @returns {bigint} the move bitboard for the rook
 */
export const getRookMovesForSquare = (bitboards, player, from) => {
  let rookBitboard = 1n << BigInt(from);
  let moves = 0n;

  const allPieces = getAllPieces(bitboards);
  const friendlyPieces = getPlayerBoard(player, bitboards);

  moves |= slide(rookBitboard, 1n, FILE_H_MASK, allPieces);
  moves |= slide(rookBitboard, -1n, FILE_A_MASK, allPieces);
  moves |= slide(rookBitboard, 8n, RANK_8_MASK, allPieces);
  moves |= slide(rookBitboard, -8n, RANK_1_MASK, allPieces);

  return moves & ~friendlyPieces;
};

/**
 * Gets the move bitboard for a queen.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {number} from - the square its moving from
 * @returns {bigint} the move bitboard for the queen
 */
export const getQueenMovesForSquare = (bitboards, player, from) => {
  let queenBitboard = 1n << BigInt(from);
  let moves = 0n;

  const allPieces = getAllPieces(bitboards);
  const friendlyPieces = getPlayerBoard(player, bitboards);

  // Orthogonal Moves
  moves |= slide(queenBitboard, 1n, FILE_H_MASK, allPieces); // Right
  moves |= slide(queenBitboard, -1n, FILE_A_MASK, allPieces); // Left
  moves |= slide(queenBitboard, 8n, RANK_8_MASK, allPieces); // Up
  moves |= slide(queenBitboard, -8n, RANK_1_MASK, allPieces); // Down

  // Diagonal Moves
  moves |= slide(queenBitboard, 9n, FILE_H_MASK & RANK_8_MASK, allPieces); // Up-right
  moves |= slide(queenBitboard, 7n, FILE_A_MASK & RANK_8_MASK, allPieces); // Up-left
  moves |= slide(queenBitboard, -7n, FILE_H_MASK & RANK_1_MASK, allPieces); // Down-right
  moves |= slide(queenBitboard, -9n, FILE_A_MASK & RANK_1_MASK, allPieces); // Down-left

  return moves & ~friendlyPieces;
};

/**
 * Gets the move bitboard for a king.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {number} from - the square its moving from
 * @param {CastlingRights} castlingRights - the castling rights for the king
 * @returns {bigint} the move bitboard for the king
 */
export const getKingMovesForSquare = (
  bitboards,
  player,
  from,
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
        isKingsideCastleLegal(bitboards, WHITE)
      ) {
        moves |= 1n << 6n;
      }
      if (
        castlingRights.whiteQueenside &&
        isQueensideCastleLegal(bitboards, WHITE)
      ) {
        moves |= 1n << 2n;
      }
    } else {
      if (
        castlingRights.blackKingside &&
        isKingsideCastleLegal(bitboards, BLACK)
      ) {
        moves |= 1n << 62n;
      }
      if (
        castlingRights.blackQueenside &&
        isQueensideCastleLegal(bitboards, BLACK)
      ) {
        moves |= 1n << 58n;
      }
    }
  }

  // Remove squares occupied by own pieces
  return moves & ~friendlyPieces;
};
