import { bitScanForward } from "./bbUtils";
import {
  getCachedAttackMask,
  updateAttackMaskHash,
} from "./PieceMasks/attackMask";
import { getMove, unMakeMove, makeMove } from "./moveMaking/makeMoveLogic";
import { getPieceAtSquare, getPlayerBoard } from "./pieceGetters";
import { getPieceMoves } from "./moveGeneration/allMoveGeneration";
import {
  BLACK,
  BLACK_KING,
  BLACK_PAWN,
  BLACK_PROMO_PIECES,
  WHITE,
  WHITE_KING,
  WHITE_PAWN,
  WHITE_PROMO_PIECES,
} from "./constants";
import { bigIntFullRep } from "./generalHelpers";
import { blackPawnMasks } from "./PieceMasks/pawnMask";

/**
 * Determines whether a given square is attacked by the opponent
 *
 * @param {BigUint64Array} bitboards - bitboards of the current position
 * @param {number} square - square to check if it is attacked
 * @param {number} opponent - the other player (0 for w, 1 for b)
 * @param {bigint} attackHash - the hash of the attack map for the opponent
 * @returns {boolean} if the square is attacked
 */
export const isSquareAttacked = (bitboards, square, opponent, attackHash) => {
  const opponentAttackMask = getCachedAttackMask(
    bitboards,
    opponent,
    attackHash
  );

  return (opponentAttackMask & (1n << BigInt(square))) !== 0n;
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

  return isSquareAttacked(bitboards, kingSquare, opponent);
};

/**
 * Filters out illegal moves from a bitboard of moves for a piece.
 * Mainly filters out moves that put your own king in check.
 *
 * @param {BigUint64Array} bitboards - bitboards of the current position
 * @param {bigint} moves - bitboard of moves for a piece
 * @param {number} from - square the piece is moving from
 * @param {number} player - whose move it is (0 for w, 1 for b)
 * @param {bigint} opponentHash - an attack hash for the position
 * @returns {Array<Move>} the filtered moves
 */
export const filterIllegalMoves = (
  bitboards,
  moves,
  from,
  player,
  enPassantSquare,
  opponentHash = null
) => {
  let filteredMoves = [];
  const isPlayerWhite = player === WHITE;
  const opponent = isPlayerWhite ? BLACK : WHITE;
  const one = 1n;
  const piece = getPieceAtSquare(from, bitboards);

  const promotionFromRank = isPlayerWhite ? 6 : 1;
  const row = Math.floor(from / 8);
  const isPromotion = row === promotionFromRank && piece % 6 === WHITE_PAWN;
  if (from === 32 && enPassantSquare === 42) {
    console.log(
      bigIntFullRep(getCachedAttackMask(bitboards, player, opponentHash))
    );
  }

  // Iterate only over moves that are set (i.e. bits that are 1)
  let remainingMoves = moves;
  while (remainingMoves !== 0n) {
    const to = bitScanForward(remainingMoves);
    remainingMoves &= remainingMoves - one;

    const move = getMove(bitboards, from, to, piece, enPassantSquare);

    // Simulate the move and check if the king is attacked
    makeMove(bitboards, move);
    const kingBB = bitboards[isPlayerWhite ? WHITE_KING : BLACK_KING];
    const kingSquare = bitScanForward(kingBB);
    let newHash = null;
    if (opponentHash) {
      newHash = updateAttackMaskHash(
        bitboards,
        opponentHash,
        move,
        opponent,
        getNewEnPassant(move),
        true
      );
    }

    if (from === 32 && enPassantSquare === 42) {
      console.log(
        bigIntFullRep(getCachedAttackMask(bitboards, player, newHash)),
        bigIntFullRep(bitboards[BLACK_PAWN]),
        move
      );
    }

    if (!isSquareAttacked(bitboards, kingSquare, opponent, newHash)) {
      if (isPromotion) {
        const promoPieces = isPlayerWhite
          ? WHITE_PROMO_PIECES
          : BLACK_PROMO_PIECES;
        for (const promoPiece of promoPieces) {
          const promoMove = move.copyWith({ promotion: promoPiece });
          filteredMoves.push(promoMove);
        }
      } else {
        filteredMoves.push(move);
      }
    }
    unMakeMove(move, bitboards);
  }

  return filteredMoves;
};

/**
 * Determines if a given player has a legal move.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {number} player - whose move it is (0 for w, 1 for b)
 * @param {number} enPassantSquare - the square where en passant is legal. Null if none
 * @returns {boolean} if the player has a legal move.
 */
export const hasLegalMove = (bitboards, player, enPassantSquare) => {
  const playerPieces = getPlayerBoard(player, bitboards);

  let pieces = playerPieces;
  while (pieces !== 0n) {
    const sq = bitScanForward(pieces);
    pieces &= pieces - 1n;

    const piece = getPieceAtSquare(sq, bitboards);

    const moves = getPieceMoves(
      bitboards,
      piece % 6,
      sq,
      player,
      enPassantSquare,
      null // Never a case where castling is the only king move
    );

    const filtered = filterIllegalMoves(
      bitboards,
      moves,
      sq,
      player,
      enPassantSquare
    );

    if (filtered.length > 0) return true;
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
