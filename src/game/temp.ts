import Move from "./moveMaking/move.ts";
import { isKing, isPawn } from "./pieceUtils/pieceClassifiers.ts";
import {
  BLACK_PAWN,
  NO_SQUARE,
  PROMO_PIECES,
  WHITE,
  WHITE_PAWN,
  type Piece,
  type Player,
  type Square,
} from "./chessConstants.ts";
import { bitScanForward } from "../coreLogic/helpers/bbUtils.mjs";

export function newEnPassant(move: Move): Square {
  const piece = move.piece;
  if (!isPawn(piece) || Math.abs(move.to - move.from) !== 16) {
    return NO_SQUARE;
  }

  const dir = piece === WHITE_PAWN ? -8 : 8;
  return move.to + dir;
}

export const opponent = (player: Player): Player => {
  return (player ^ 1) as Player;
};

/**
 * Converts a move bitboard into an array of moves.
 */
export const getMovesFromBB = (
  bitboard: bigint,
  from: Square,
  piece: Piece,
  enPassantSquare: Square,
  player: Player,
  pieceAt: Piece[],
) => {
  const moveArr = [];

  const promotionFromRank = player === WHITE ? 6 : 1;
  const row = Math.floor(from / 8);
  const isPromotion = row === promotionFromRank && isPawn(piece);
  const oppPawn = piece <= 5 ? BLACK_PAWN : WHITE_PAWN;

  let moves = bitboard;
  while (moves !== 0n) {
    const to = bitScanForward(moves);
    moves &= moves - 1n;

    const castling = isKing(piece) && Math.abs(from - to) === 2;
    const enPassant = to === enPassantSquare && isPawn(piece);
    const captured = enPassant ? oppPawn : pieceAt[to];

    const baseMove = new Move(
      from,
      to,
      piece,
      captured,
      null,
      castling,
      enPassant,
    );

    // If a promotion is possible, can promote to knight, bishop, rook, or queen
    if (isPromotion) {
      for (const promoPiece of PROMO_PIECES[player]) {
        const promoMove = baseMove.copyWith({ promotion: promoPiece });
        moveArr.push(promoMove);
      }
    } else {
      moveArr.push(baseMove);
    }
  }

  return moveArr;
};
