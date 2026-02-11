import type { Player, Square } from "./types.ts";
import type Move from "./moveMaking/move.ts";
import { isPawn } from "./pieceUtils/pieceClassifiers.ts";
import { NO_SQUARE, WHITE_PAWN } from "./chessConstants.ts";

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
