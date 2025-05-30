import { bitScanForward, isKing, popcount } from "./bbUtils";
import { getAllPieces, pieceAt } from "./pieceGetters";
import { getPieceMoves } from "./moveGeneration/allMoveGeneration";
import {
  BLACK,
  BLACK_KING,
  BLACK_PAWN,
  WHITE,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
} from "./constants";
import {
  computePinned,
  makePinRayMaskGenerator,
} from "./moveGeneration/computePinned";
import { getCheckers, getRayBetween } from "./moveGeneration/checkersMask";
import { getKingMovesForSquare } from "./moveGeneration/majorPieceMoveGeneration";
import { getAttackMask } from "./PieceMasks/attackMask";
import { kingMasks } from "./PieceMasks/kingMask";
import { getPlayerIndicies, indexArrays } from "./pieceIndicies";

/**
 * Determines whether a given square is attacked by the opponent
 *
 * @param {number} square - square to check if it is attacked
 * @param {bigint} opponentAttackMap - the attack map for the opponent
 * @returns {boolean} if the square is attacked
 */
export const isSquareAttacked = (square, opponentAttackMap) => {
  return (opponentAttackMap & (1n << BigInt(square))) !== 0n;
};

/**
 * Determines whether a given player is in check.
 *
 * @param {BigUint64Array} bitboards - bitboards of the current position
 * @param {number} player - whose move it is (0 for w, 1 for b)
 * @returns {boolean} whether the player is in check
 */
export const isInCheck = (bitboards, player) => {
  let kingIndex = WHITE_KING;
  let opponent = BLACK;
  if (player === BLACK) {
    kingIndex = BLACK_KING;
    opponent = WHITE;
  }

  const kingSquare = indexArrays[kingIndex][0];
  const opponentAttackMask = getAttackMask(opponent);

  return isSquareAttacked(kingSquare, opponentAttackMask);
};

/**
 * Determines if a player has a legal move. Same logic as getAllLegalMoves, but
 * it breaks whenever it finds a piece that has moves.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {Array<boolean>} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @returns {boolean} if the player has a legal move
 */
export const hasLegalMove = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare
) => {
  const isWhite = player === WHITE;
  const opponent = isWhite ? BLACK : WHITE;
  const oppAttackMask = getAttackMask(opponent);

  const kingIndex = isWhite ? WHITE_KING : BLACK_KING;
  const kingSq = indexArrays[kingIndex][0];

  // If king is not in check and it has a move then there is a legal move
  if (
    kingSq & (oppAttackMask === 0n) &&
    kingMasks[kingSq] & ~oppAttackMask & (~getAllPieces(bitboards) !== 0n)
  ) {
    return true;
  }
  const pinnedMask = computePinned(bitboards, player, kingSq);
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

      return kingMoves !== 0n;
    }
    if (numCheck !== 1) {
      throw new Error("KING IN CHECK W/O CHECKERS");
    }

    // Single check
    const oppSq = bitScanForward(checkers);

    // If a knight check, need to catpure it (or move king)
    if (pieceAt[oppSq] % 6 === WHITE_KNIGHT) {
      kingCheckMask = checkers;
    } else {
      const rayMask = getRayBetween(kingSq, oppSq);
      kingCheckMask = rayMask | checkers;
    }
  }

  let playerIndicies = getPlayerIndicies(player);
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

    const legalMoves = isKing(piece) ? pieceMoves : pieceMoves & kingCheckMask;

    if (legalMoves !== 0n) {
      return true;
    }
  }

  return false;
};

/**
 * Gets the new en passant square for a move
 *
 * @param {Move} move - the move object
 * @returns the new enPassant square
 */
export const getNewEnPassant = (move) => {
  const piece = move.piece;
  let enPassantSquare = null;
  if (
    (piece === WHITE_PAWN || piece === BLACK_PAWN) &&
    Math.abs(move.to - move.from) === 16
  ) {
    const dir = piece === WHITE_PAWN ? -8 : 8;
    enPassantSquare = move.to + dir;
  }
  return enPassantSquare;
};
