import { bitScanForward } from "../helpers/bbUtils.ts";
import {
  BLACK_PAWN,
  NO_PIECE,
  NO_SQUARE,
  PROMO_PIECES,
  PROMO_RANK,
  WHITE,
  WHITE_PAWN,
  type Piece,
  type Player,
  type Square,
} from "../chessConstants.ts";
import { isKing, isPawn } from "../pieceUtils/pieceClassifiers.ts";
import Move from "./move.ts";
import { getRank } from "../helpers/boardUtils.ts";

export function newEnPassant(move: Move): Square {
  const piece = move.piece;
  if (!isPawn(piece) || Math.abs(move.to - move.from) !== 16) {
    return NO_SQUARE;
  }

  const dir = piece === WHITE_PAWN ? -8 : 8;
  return (move.to + dir) as Square;
}

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

  const rank = getRank(from);
  const isPromotion = rank === PROMO_RANK[player] && isPawn(piece);
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
      NO_PIECE,
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
