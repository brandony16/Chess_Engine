import { getPlayerBoard, pieceAt } from "../pieceGetters.mjs";
import { getAttackMask } from "../PieceMasks/attackMask.mjs";
import * as C from "../constants.mjs";
import { computePinned, makePinRayMaskGenerator } from "./computePinned.mjs";
import { getCheckers, getRayBetween } from "./checkersMask.mjs";
import { bitScanForward, isKing, popcount } from "../bbUtils.mjs";
import { getKingMovesForSquare } from "./majorPieceMoveGeneration.mjs";
import { getMovesFromBB } from "../moveMaking/makeMoveLogic.mjs";
import { getPlayerIndicies, indexArrays } from "../pieceIndicies.mjs";
import { getPieceMoves } from "./allMoveGeneration.mjs";

/**
 * Generates quiescence moves for a position. These are captures and promotions.
 * Helps avoid the horizon effect where engines cant correctly evaluate capture
 * sequences due to limited depth.
 * @param {BigUint64Array} bitboards - the bitboard of the position
 * @param {0 | 1} player - whose moves to get
 * @param {number} enPassantSquare - the en passant square
 * @returns {Array<Move>} - the quiescence moves
 */
export const getQuiescenceMoves = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare
) => {
  let allMoves = [];

  const isWhite = player === C.WHITE;
  const opponent = isWhite ? C.BLACK : C.WHITE;
  const oppAttackMask = getAttackMask(opponent);
  const oppPieces = getPlayerBoard(opponent, bitboards);

  const kingIndex = isWhite ? C.WHITE_KING : C.BLACK_KING;
  const kingSq = indexArrays[kingIndex][0];

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

      const kingCaptures = kingMoves & oppPieces;
      if (kingCaptures === 0n) return [];

      return getMovesFromBB(
        kingCaptures,
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
    if (pieceAt[oppSq] % 6 === C.WHITE_KNIGHT) {
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

    const captures = pieceMoves & oppPieces;
    if (captures === 0n) continue;

    const legalMoves = isKing(piece) ? captures : captures & kingCheckMask;
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
