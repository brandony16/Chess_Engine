import { bitScanForward, isKing, popcount } from "./bbUtils";
import { getAllPieces, getPlayerBoard, pieceAt } from "./pieceGetters";
import { getPieceMoves } from "./moveGeneration/allMoveGeneration";
import {
  BLACK,
  BLACK_BISHOP,
  BLACK_KING,
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
} from "./constants";
import {
  computePinned,
  makePinRayMaskGenerator,
} from "./moveGeneration/computePinned";
import { getCheckers, getRayBetween } from "./moveGeneration/checkersMask";
import { getKingMovesForSquare } from "./moveGeneration/majorPieceMoveGeneration";
import { getAttackMask } from "./PieceMasks/attackMask";
import { kingMasks } from "./PieceMasks/kingMask";
import { bigIntFullRep } from "./debugFunctions";
import { bitboardsToFEN } from "./FENandUCIHelpers";

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
  let kingBB = bitboards[WHITE_KING];
  let opponent = BLACK;
  if (player === BLACK) {
    kingBB = bitboards[BLACK_KING];
    opponent = WHITE;
  }

  const kingSquare = bitScanForward(kingBB);
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

  const kingBB = isWhite ? bitboards[WHITE_KING] : bitboards[BLACK_KING];
  const kingSq = bitScanForward(kingBB);

  // If king is not in check and it has a move then there is a legal move
  if (
    kingSq & (oppAttackMask === 0n) &&
    kingMasks[kingSq] & ~oppAttackMask & (~getAllPieces(bitboards) !== 0n)
  ) {
    return true;
  }
  const pinnedMask = computePinned(bitboards, player);
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
      console.log(player);
      console.log(numCheck);
      console.log(bigIntFullRep(oppAttackMask));
      console.log(bigIntFullRep(kingBB));
      console.log(bigIntFullRep(getCheckers(bitboards, player, kingSq)))
      console.log(kingSq);
      console.log("Queen ");
      console.log(bigIntFullRep(bitboards[WHITE_QUEEN]));
      console.log(bigIntFullRep(bitboards[BLACK_QUEEN]));
      console.log("Bishop ");
      console.log(bigIntFullRep(bitboards[WHITE_BISHOP]));
      console.log(bigIntFullRep(bitboards[BLACK_BISHOP]));
      console.log("Rook ");
      console.log(bigIntFullRep(bitboards[WHITE_ROOK]));
      console.log(bigIntFullRep(bitboards[BLACK_ROOK]));
      console.log(bitboardsToFEN(bitboards, player, castlingRights, enPassantSquare));
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

  let pieces = getPlayerBoard(player, bitboards);
  while (pieces !== 0n) {
    const square = bitScanForward(pieces);
    pieces &= pieces - 1n;

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
