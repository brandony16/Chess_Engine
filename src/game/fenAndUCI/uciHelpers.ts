import {
  COLUMN_SYMBOLS,
  NO_PIECE,
  PIECE_SYMBOLS,
  type Square,
} from "../chessConstants.ts";
import type Move from "../moveMaking/move.ts";

/**
 * Converts a move object into UCI notation
 * @param {Move} move - the move
 * @returns {string} - the move in uci form
 */
export function moveToUCI(move: Move): string {
  const from = indexToSquare(move.from);
  const to = indexToSquare(move.to);
  const promo =
    move.promotion !== NO_PIECE
      ? PIECE_SYMBOLS[move.promotion].toLowerCase()
      : "";

  return from + to + promo;
}

function indexToSquare(index: Square): string {
  const col = index % 8;
  const row = Math.floor(index / 8);

  const colSymbol = COLUMN_SYMBOLS[col];

  return colSymbol + (row + 1);
}
