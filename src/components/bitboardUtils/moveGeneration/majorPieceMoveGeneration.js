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
  isKingsideCastleLegal,
  isQueensideCastleLegal,
} from "../moveMaking/castleMoveLogic";
import { getAllPieces, getBlackPieces, getWhitePieces } from "../pieceGetters";
import { kingMasks } from "../PieceMasks/kingMask";

/**
 * Gets the move bitboard for a rook.
 * @param {Bitboards} bitboards - the bitboards in the current position
 * @param {string} player - whose piece it is ("w" or "b")
 * @param {number} from - the square its moving from
 * @returns {bigint} the move bitboard for the rook
 */
export const getRookMovesForSquare = (bitboards, player, from) => {
  let rookBitboard = 1n << BigInt(from);
  let moves = 0n;

  const allPieces = getAllPieces(bitboards);
  const friendlyPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  moves |= slide(rookBitboard, 1n, FILE_H_MASK, allPieces);
  moves |= slide(rookBitboard, -1n, FILE_A_MASK, allPieces);
  moves |= slide(rookBitboard, 8n, RANK_8_MASK, allPieces);
  moves |= slide(rookBitboard, -8n, RANK_1_MASK, allPieces);

  return moves & ~friendlyPieces;
};

/**
 * Gets the move bitboard for a queen.
 * @param {Bitboards} bitboards - the bitboards in the current position
 * @param {string} player - whose piece it is ("w" or "b")
 * @param {number} from - the square its moving from
 * @returns {bigint} the move bitboard for the queen
 */
export const getQueenMovesForSquare = (bitboards, player, from) => {
  let queenBitboard = 1n << BigInt(from);
  let moves = 0n;

  const allPieces = getAllPieces(bitboards);
  const friendlyPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

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
 * @param {Bitboards} bitboards - the bitboards in the current position
 * @param {string} player - whose piece it is ("w" or "b")
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
  const isPlayerWhite = player === "w";

  const friendlyPieces = isPlayerWhite
    ? getWhitePieces(bitboards)
    : getBlackPieces(bitboards);

  /* CASTLING */
  if (castlingRights) {
    if (isPlayerWhite) {
      if (
        castlingRights.whiteKingside &&
        isKingsideCastleLegal(bitboards, "w")
      ) {
        moves |= 1n << 6n;
      }
      if (
        castlingRights.whiteQueenside &&
        isQueensideCastleLegal(bitboards, "w")
      ) {
        moves |= 1n << 2n;
      }
    } else {
      if (
        castlingRights.blackKingside &&
        isKingsideCastleLegal(bitboards, "b")
      ) {
        moves |= 1n << 62n;
      }
      if (
        castlingRights.blackQueenside &&
        isQueensideCastleLegal(bitboards, "b")
      ) {
        moves |= 1n << 58n;
      }
    }
  }

  // Remove squares occupied by own pieces
  return moves & ~friendlyPieces;
};
