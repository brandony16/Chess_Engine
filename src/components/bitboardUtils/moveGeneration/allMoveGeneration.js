import { bitScanForward, popcount } from "../bbUtils";
import {
  BLACK,
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  WHITE,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../constants";
import { getMovesFromBB } from "../moveMaking/makeMoveLogic";
import { getPieceAtSquare, getPlayerBoard } from "../pieceGetters";
import { getCachedAttackMask } from "../PieceMasks/attackMask";
import { getCheckers, getRayBetween } from "./checkersMask";
import { computePinned, makePinRayMaskGenerator } from "./computePinned";
import {
  getKingMovesForSquare,
  getQueenMovesForSquare,
  getRookMovesForSquare,
} from "./majorPieceMoveGeneration";
import {
  getBishopMovesForSquare,
  getKnightMovesForSquare,
  getPawnMovesForSquare,
} from "./minorPieceMoveGeneration";

/**
 * @typedef {object} CastlingRights
 * @property {boolean} whiteKingside - Whether castling kingside is legal for white
 * @property {boolean} whiteQueenside - Whether castling queenside is legal for white
 * @property {boolean} blackKingside - Whether castling kingside is legal for black
 * @property {boolean} blackQueenside - Whether castling queenside is legal for black
 */

/**
 * Gets the moves for a specific piece. Returns a bitboard of the moves for that piece.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {int} piece - index of the piece to get the moves for
 * @param {number} from - the square to move from
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {boolean} onlyCaptures - whether the moves should only be captures
 * @returns {bigint} a bitboard of the moves of the piece
 */
export const getPieceMoves = (
  bitboards,
  piece,
  from,
  player,
  enPassantSquare,
  castlingRights,
  oppAttackMask,
  pinnedMask,
  getRayMask
) => {
  let moves = null;
  switch (piece) {
    case WHITE_PAWN:
    case BLACK_PAWN:
      moves = getPawnMovesForSquare(
        bitboards,
        player,
        from,
        enPassantSquare,
        pinnedMask,
        getRayMask
      );
      break;
    case WHITE_KNIGHT:
    case BLACK_KNIGHT:
      moves = getKnightMovesForSquare(bitboards, player, from, pinnedMask);
      break;
    case WHITE_BISHOP:
    case BLACK_BISHOP:
      moves = getBishopMovesForSquare(
        bitboards,
        player,
        from,
        pinnedMask,
        getRayMask
      );
      break;
    case WHITE_ROOK:
    case BLACK_ROOK:
      moves = getRookMovesForSquare(
        bitboards,
        player,
        from,
        pinnedMask,
        getRayMask
      );
      break;
    case WHITE_QUEEN:
    case BLACK_QUEEN:
      moves = getQueenMovesForSquare(
        bitboards,
        player,
        from,
        pinnedMask,
        getRayMask
      );
      break;
    case WHITE_KING:
    case BLACK_KING:
      moves = getKingMovesForSquare(
        bitboards,
        player,
        from,
        oppAttackMask,
        castlingRights
      );
      break;
    default:
      moves = BigInt(0); // No legal moves
  }

  return moves;
};

/**
 * Gets all of the legal moves a player has as a bitboard.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {bigint} opponentHash - A hash for the opponents attack map
 * @returns {Array<Move>} a bitboard of all the legal moves a player has
 */
export const getAllLegalMoves = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  opponentHash = null
) => {
  let allMoves = [];

  const isWhite = player === WHITE;
  const opponent = isWhite ? BLACK : WHITE;
  const oppAttackMask = getCachedAttackMask(bitboards, opponent, opponentHash);
  const pinnedMask = computePinned(bitboards, player);

  const kingBB = isWhite ? bitboards[WHITE_KING] : bitboards[BLACK_KING];
  const kingSq = bitScanForward(kingBB);
  const getRayMask = makePinRayMaskGenerator(kingSq);
  let kingCheckMask = ~0n;

  // If king is in check
  if (oppAttackMask & (1n << BigInt(kingSq))) {
    const checkers = getCheckers(bitboards, player, kingSq);
    const numCheck = popcount(checkers);

    // Double check, only king moves are possible
    if (numCheck > 1) {
      const kingMoves = getKingMovesForSquare(
        bitboards,
        player,
        kingSq,
        oppAttackMask,
        castlingRights
      );

      return getMovesFromBB(
        bitboards,
        kingMoves,
        kingSq,
        isWhite ? WHITE_KING : BLACK_KING,
        enPassantSquare,
        player
      );
    }

    // Single check
    const oppSq = bitScanForward(checkers);
    const rayMask = getRayBetween(kingSq, oppSq);
    kingCheckMask = rayMask & checkers;
  }

  let pieces = getPlayerBoard(player, bitboards);
  while (pieces !== 0n) {
    const square = bitScanForward(pieces);
    pieces &= pieces - 1n;

    const piece = getPieceAtSquare(square, bitboards);
    const formattedPiece = piece % 6;

    const pieceMoves = getPieceMoves(
      bitboards,
      formattedPiece,
      square,
      player,
      enPassantSquare,
      castlingRights,
      oppAttackMask,
      pinnedMask,
      getRayMask
    );

    const legalMoves = pieceMoves & kingCheckMask;

    const legalMoveArr = getMovesFromBB(
      bitboards,
      legalMoves,
      square,
      piece,
      enPassantSquare,
      player
    );

    allMoves = allMoves.concat(legalMoveArr);
  }

  return allMoves;
};
