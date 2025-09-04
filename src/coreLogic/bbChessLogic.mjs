import { bitScanForward, popcount } from "./helpers/bbUtils.mjs";
import { getAllPieces, pieceAt } from "./pieceGetters.mjs";
import { getPieceMoves } from "./moveGeneration/allMoveGeneration.mjs";
import {
  BLACK,
  BLACK_KING,
  BLACK_PAWN,
  WHITE,
  WHITE_KING,
  WHITE_PAWN,
} from "./constants.mjs";
import {
  computePinned,
  makePinRayMaskGenerator,
} from "./moveGeneration/computePinned.mjs";
import { getCheckers, getRayBetween } from "./moveGeneration/checkersMask.mjs";
import { getKingMovesForSquare } from "./moveGeneration/majorPieceMoveGeneration.mjs";
import { getAttackMask } from "./PieceMasks/attackMask.mjs";
import { kingMasks } from "./PieceMasks/kingMask.mjs";
import { getPlayerIndicies, indexArrays } from "./pieceIndicies.mjs";
import { bitboardsToFEN } from "./helpers/FENandUCIHelpers.mjs";
import { bigIntFullRep } from "./debugFunctions.mjs";
import { computeAllAttackMasks } from "./PieceMasks/individualAttackMasks.mjs";
import { isKing, isKnight } from "./helpers/pieceUtils.mjs";

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
  if (kingSq === undefined) {
    console.log(indexArrays[kingIndex], kingIndex);
    console.log(
      bitboardsToFEN(bitboards, player, castlingRights, enPassantSquare)
    );
  }
  const kingMask = 1n << BigInt(kingSq);

  // If king is not in check and it has a move then there is a legal move
  if (
    (kingMask & oppAttackMask) === 0n &&
    (kingMasks[kingSq] & ~oppAttackMask & ~getAllPieces(bitboards)) !== 0n
  ) {
    return true;
  }
  const pinnedMask = computePinned(bitboards, player, kingSq);
  const getRayMask = makePinRayMaskGenerator(kingSq);
  let kingCheckMask = ~0n;

  // If king is in check
  if (oppAttackMask & kingMask) {
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
      console.log(
        bitboardsToFEN(bitboards, player, castlingRights, enPassantSquare)
      );
      console.log(bigIntFullRep(oppAttackMask));
      computeAllAttackMasks(bitboards);
      console.log(bigIntFullRep(getAttackMask(opponent)));
      throw new Error("KING IN CHECK W/O CHECKERS");
    }

    // Single check
    const oppSq = bitScanForward(checkers);

    // If a knight check, need to catpure it (or move king)
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