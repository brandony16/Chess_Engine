import { bitScanForward } from "../../bbUtils";
import {
  BLACK_PAWN,
  BLACK_PROMO_PIECES,
  FILE_A_MASK,
  FILE_H_MASK,
  RANK_1_MASK,
  RANK_8_MASK,
  WHITE,
  WHITE_PAWN,
  WHITE_PROMO_PIECES,
} from "../../constants";
import Move from "../../moveMaking/move";
import { getPieceAtSquare } from "../../pieceGetters";

/**
 * Gets the captures and promotions for the pawns
 *
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - whose piece it is (0 for w, 1 for b)
 * @param {number} from - the square its moving from
 * @param {number} enPassantSquare - the square where en passant is legal
 * @returns {Array<Move>} the move bitboard for the pawn
 */
export const pawnQuiescence = (
  bitboards,
  player,
  opponentPieces,
  enPassantSquare
) => {
  const moves = [];

  const isPlayerWhite = player === WHITE;
  const piece = isPlayerWhite ? WHITE_PAWN : BLACK_PAWN;
  const pawns = isPlayerWhite ? bitboards[WHITE_PAWN] : bitboards[BLACK_PAWN];

  let captureLeft = isPlayerWhite
    ? (pawns << 7n) & FILE_H_MASK & opponentPieces
    : (pawns >> 9n) & FILE_A_MASK & opponentPieces;
  let captureRight = isPlayerWhite
    ? (pawns << 9n) & FILE_A_MASK & opponentPieces
    : (pawns >> 7n) & FILE_H_MASK & opponentPieces;

  // The masks are everything but that rank, so we to negate them
  const promoRankMask = isPlayerWhite ? ~RANK_8_MASK : ~RANK_1_MASK;
  let promoCapLeft = captureLeft & promoRankMask;
  let promoCapRight = captureRight & promoRankMask;

  // Mask out promotion captures so they are not double counted
  captureLeft &= ~promoRankMask;
  captureRight &= ~promoRankMask;

  // Normal captures
  for (let captures of [captureLeft, captureRight]) {
    let cap = captures;
    const isLeft = captures === captureLeft;
    while (cap) {
      const to = bitScanForward(cap);
      cap &= cap - 1n;
      const from = isPlayerWhite
        ? to - (isLeft ? 7 : 9)
        : to + (isLeft ? 9 : 7);
      const piece = isPlayerWhite ? WHITE_PAWN : BLACK_PAWN;
      const captured = getPieceAtSquare(to, bitboards);
      const move = new Move(from, to, piece, captured, null, false, false);
      moves.push(move);
    }
  }

  // Promotion captures
  const promoPieces = isPlayerWhite ? WHITE_PROMO_PIECES : BLACK_PROMO_PIECES;
  for (let promotion of [promoCapLeft, promoCapRight]) {
    let promo = promotion;
    const isLeft = promotion === captureLeft;
    while (promo) {
      const to = bitScanForward(promo);
      promo &= promo - 1n;
      const from = isPlayerWhite
        ? to - (isLeft ? 7 : 9)
        : to + (isLeft ? 9 : 7);
      const captured = getPieceAtSquare(to, bitboards);

      for (const promoPiece of promoPieces) {
        const move = new Move(
          from,
          to,
          piece,
          captured,
          promoPiece,
          false,
          false
        );
        moves.push(move);
      }
    }
  }

  // Normal promotions
  // Needs squares that enemy pieces are not at, as pawns cannot capute moving forward
  let promoSquares = isPlayerWhite
    ? (pawns << 8n) & promoRankMask & ~opponentPieces
    : (pawns >> 8n) & promoRankMask & ~opponentPieces;
  while (promoSquares) {
    const to = bitScanForward(promoSquares);
    promoSquares &= promoSquares - 1n;
    const from = isPlayerWhite ? to - 8 : to + 8;
    const captured = getPieceAtSquare(to, bitboards);

    for (const promoPiece of promoPieces) {
      const move = new Move(
        from,
        to,
        piece,
        captured,
        promoPiece,
        false,
        false
      );
      moves.push(move);
    }
  }

  if (enPassantSquare !== null) {
    let pawnBB = 0n;
    if (player === WHITE) {
      // White pawn capturing to the left
      pawnBB |= (1n << BigInt(enPassantSquare - 7)) & pawns & FILE_A_MASK;
      // White pawn capturing to the right
      pawnBB |= (1n << BigInt(enPassantSquare - 9)) & pawns & FILE_H_MASK;
    } else {
      // Black pawn capturing to the right
      pawnBB |= (1n << BigInt(enPassantSquare + 7)) & pawns & FILE_H_MASK;
      // Black pawn capturing to the left
      pawnBB |= (1n << BigInt(enPassantSquare + 9)) & pawns & FILE_A_MASK;
    }

    while (pawnBB) {
      const from = bitScanForward(pawnBB);
      pawnBB &= pawnBB - 1n;
      const captured = isPlayerWhite ? BLACK_PAWN : WHITE_PAWN;
      const move = new Move(
        from,
        enPassantSquare, // to
        piece,
        captured,
        null,
        false,
        false
      );
      moves.push(move);
    }
  }

  return moves;
};
