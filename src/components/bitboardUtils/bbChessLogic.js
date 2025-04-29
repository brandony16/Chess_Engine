import { bitScanForward } from "./bbUtils";
import { getCachedAttackMask } from "./PieceMasks/attackMask";
import { makeMove } from "./moveMaking/makeMoveLogic";
import {
  getBlackPieces,
  getPieceAtSquare,
  getWhitePieces,
} from "./pieceGetters";
import { getPieceMoves } from "./moveGeneration/allMoveGeneration";
import { GENERAL_SYMBOLS } from "./constants";
import { bigIntFullRep } from "./generalHelpers";

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

/**
 * Determines whether a given square is attacked by the opponent
 *
 * @param {Bitboards} bitboards - bitboards of the current position
 * @param {number} square - square to check if it is attacked
 * @param {string} opponent - the other player ("w" or "b")
 * @param {bigint} attackHash - the hash of the attack map for the opponent
 * @returns {boolean} if the square is attacked
 */
export const isSquareAttacked = (bitboards, square, opponent, attackHash) => {
  const opponentAttackMask = getCachedAttackMask(
    bitboards,
    opponent,
    attackHash
  );
  // if ((opponentAttackMask & (1n << BigInt(square))) !== 0n) {
  //   console.log(bigIntFullRep(opponentAttackMask), square)
  // }
  return (opponentAttackMask & (1n << BigInt(square))) !== 0n;
};

/**
 * Determines whether a given player is in check.
 *
 * @param {Bitboards} bitboards - bitboards of the current position
 * @param {string} player - player whose turn it is ("w" or "b")
 * @returns {boolean} whether the player is in check
 */
export const isInCheck = (bitboards, player) => {
  let kingBB = bitboards.whiteKings;
  let opponent = "b";
  if (player === "b") {
    kingBB = bitboards.blackKings;
    opponent = "w";
  }

  const kingSquare = bitScanForward(kingBB);

  return isSquareAttacked(bitboards, kingSquare, opponent);
};

/**
 * Filters out illegal moves from a bitboard of moves for a piece.
 * Mainly filters out moves that put your own king in check.
 *
 * @param {Bitboards} bitboards - bitboards of the current position
 * @param {bigint} moves - bitboard of moves for a piece
 * @param {number} from - square the piece is moving from
 * @param {string} player - player whose turn it is ("w" or "b")
 * @param {bigint} hash - an attack hash for the position
 * @returns {bigint} the filtered moves
 */
export const filterIllegalMoves = (bitboards, moves, from, player, hash = null) => {
  let filteredMoves = 0n;
  const isPlayerWhite = player === "w";
  const one = 1n;

  // Iterate only over moves that are set (i.e. bits that are 1)
  let remainingMoves = moves;
  while (remainingMoves !== 0n) {
    const to = bitScanForward(remainingMoves);
    remainingMoves &= remainingMoves - one;

    // Simulate the move and check if the king is attacked
    const tempBitboards = makeMove(bitboards, from, to, null).bitboards;
    const kingBB = tempBitboards[isPlayerWhite ? "whiteKings" : "blackKings"];
    const kingSquare = bitScanForward(kingBB);
    if (
      !isSquareAttacked(tempBitboards, kingSquare, isPlayerWhite ? "b" : "w", hash)
    ) {
      filteredMoves |= 1n << BigInt(to);
    }
  }

  return filteredMoves;
};

/**
 * Determines if a given player has a legal move.
 *
 * @param {Bitboards} bitboards - the bitboards of the position
 * @param {string} player - who to check if they have a move ("w" or "b")
 * @param {number} enPassantSquare - the square where en passant is legal. Null if none
 * @returns {boolean} if the player has a legal move.
 */
export const hasLegalMove = (bitboards, player, enPassantSquare) => {
  const playerPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  let pieces = playerPieces;
  while (pieces !== 0n) {
    const sq = bitScanForward(pieces);
    pieces &= pieces - 1n;

    const piece = GENERAL_SYMBOLS[getPieceAtSquare(sq, bitboards)];
    const moves = getPieceMoves(
      bitboards,
      piece,
      sq,
      player,
      enPassantSquare,
      null // Never a case where castling is the only king move
    );

    const filtered = filterIllegalMoves(bitboards, moves, sq, player);
    if (filtered !== 0n) return true;
  }
  return false;
};
