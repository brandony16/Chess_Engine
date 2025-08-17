import { bitScanForward, isBitSet, popcount } from "../helpers/bbUtils.mjs";
import * as C from "../constants.mjs";
import { getMovesFromBB } from "../moveMaking/makeMoveLogic.mjs";
import { pieceAt } from "../pieceGetters.mjs";
import { getPlayerIndicies, indexArrays } from "../pieceIndicies.mjs";
import { getAttackMask } from "../PieceMasks/attackMask.mjs";
import { getCheckers, getRayBetween } from "./checkersMask.mjs";
import { computePinned, makePinRayMaskGenerator } from "./computePinned.mjs";
import {
  getKingMovesForSquare,
  getMagicQueenMovesForSquare,
  getMagicRookMovesForSquare,
} from "./majorPieceMoveGeneration.mjs";
import {
  getKnightMovesForSquare,
  getMagicBishopMovesForSquare,
  getPawnMovesForSquare,
} from "./minorPieceMoveGeneration.mjs";
import { isKing, isKnight, isPawn } from "../helpers/pieceUtils";

/**
 * Gets the moves for a specific piece. Returns a bitboard of the moves for that piece.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {int} piece - index of the piece to get the moves for
 * @param {number} from - the square to move from
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {Array<boolean>} castlingRights - the castling rights
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
    case C.WHITE_PAWN:
    case C.BLACK_PAWN:
      moves = getPawnMovesForSquare(
        bitboards,
        player,
        from,
        enPassantSquare,
        pinnedMask,
        getRayMask
      );
      break;
    case C.WHITE_KNIGHT:
    case C.BLACK_KNIGHT:
      moves = getKnightMovesForSquare(bitboards, player, from, pinnedMask);
      break;
    case C.WHITE_BISHOP:
    case C.BLACK_BISHOP:
      moves = getMagicBishopMovesForSquare(
        bitboards,
        player,
        from,
        pinnedMask,
        getRayMask
      );
      break;
    case C.WHITE_ROOK:
    case C.BLACK_ROOK:
      moves = getMagicRookMovesForSquare(
        bitboards,
        player,
        from,
        pinnedMask,
        getRayMask
      );
      break;
    case C.WHITE_QUEEN:
    case C.BLACK_QUEEN:
      moves = getMagicQueenMovesForSquare(
        bitboards,
        player,
        from,
        pinnedMask,
        getRayMask
      );
      break;
    case C.WHITE_KING:
    case C.BLACK_KING:
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
 * @param {Array<boolean>} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @returns {Array<Move>} a bitboard of all the legal moves a player has
 */
export const getAllLegalMoves = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare
) => {
  let allMoves = [];

  const isWhite = player === C.WHITE;
  const opponent = isWhite ? C.BLACK : C.WHITE;
  const oppAttackMask = getAttackMask(opponent);

  const kingIndex = isWhite ? C.WHITE_KING : C.BLACK_KING;
  const kingSq = indexArrays[kingIndex][0];

  const pinnedMask = computePinned(bitboards, player, kingSq);
  const getRayMask = makePinRayMaskGenerator(kingSq);
  let kingCheckMask = ~0n;

  // If king is in check
  const isKingInCheck = oppAttackMask & (1n << BigInt(kingSq));
  if (isKingInCheck) {
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
        kingMoves,
        kingSq,
        isWhite ? C.WHITE_KING : C.BLACK_KING,
        enPassantSquare,
        player
      );
    }
    if (numCheck !== 1) {
      throw new Error("KING IN CHECK W/O CHECKERS");
    }

    // Single check
    const oppSq = bitScanForward(checkers);

    // If a knight check, need to capture it (or move king)
    if (isKnight(pieceAt[oppSq])) {
      kingCheckMask = checkers;
    } else {
      const rayMask = getRayBetween(kingSq, oppSq);
      kingCheckMask = rayMask | checkers;
    }
  }

  const playerIndicies = getPlayerIndicies(player);
  for (const square of playerIndicies) {
    const piece = pieceAt[square];

    const pieceMoves = getPieceMoves(
      bitboards,
      piece,
      square,
      player,
      enPassantSquare,
      castlingRights,
      oppAttackMask,
      pinnedMask,
      getRayMask
    );
    if (pieceMoves === 0n) continue;

    let legalMoves = isKing(piece) ? pieceMoves : pieceMoves & kingCheckMask;
    if (
      isKingInCheck &&
      enPassantSquare &&
      isPawn(piece) &&
      isBitSet(pieceMoves, enPassantSquare)
    ) {
      legalMoves = legalMoves | (1n << BigInt(enPassantSquare));
    }
    if (legalMoves === 0n) continue;

    const legalMoveArr = getMovesFromBB(
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
