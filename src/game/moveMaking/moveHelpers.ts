import { NO_SQUARE, WHITE_PAWN, type Square } from "../chessConstants.ts";
import { isDouble, movePiece, moveTo, type Move } from "./move.ts";

export function newEnPassant(move: Move): Square {
  const piece = movePiece(move);
  if (!isDouble(move)) {
    return NO_SQUARE;
  }

  const dir = piece === WHITE_PAWN ? -8 : 8;
  return (moveTo(move) + dir) as Square;
}
