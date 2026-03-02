import {
  COLUMN_INDEXES,
  COLUMN_SYMBOLS,
  NO_PIECE,
  PIECE_INDEXES,
  PIECE_SYMBOLS,
  WHITE,
  type Piece,
  type Square,
} from "../chessConstants.ts";
import type Move from "../moveMaking/move.ts";
import type { Position } from "../Position.ts";

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

/**
 * Converts a uci move into a move object
 *
 */
export function uciToMove(uciMove: string, pos: Position) {
  const from = squareToIndex(uciMove.slice(0, 2));
  const to = squareToIndex(uciMove.slice(2, 4));

  let promotion: Piece = NO_PIECE;
  if (uciMove.length === 5) {
    const pieceChar =
      pos.sideToMove === WHITE ? uciMove[4].toUpperCase() : uciMove[4];
    if (!isValidPieceChar(pieceChar)) {
      throw new Error(`Invalid piece character ${pieceChar}`);
    }
    promotion = PIECE_INDEXES[pieceChar];
  }

  const legalMoves = pos.generateLegalMoves();

  for (const move of legalMoves) {
    if (from === move.from && to === move.to && promotion === move.promotion) {
      return move;
    }
  }

  throw new Error("UCI move not found");
}

function isValidPieceChar(c: string): c is keyof typeof PIECE_INDEXES {
  return c in PIECE_INDEXES;
}

function squareToIndex(square: string) {
  const col = square.charAt(0);
  const row = square.charAt(1);

  if (!isValidColChar(col)) {
    throw new Error(`Invalid column ${col}`);
  }

  const rowNum = parseInt(row) - 1; // Rows arent 0 indexed
  const colNum = COLUMN_INDEXES[col];

  return rowNum * 8 + colNum;
}

function isValidColChar(c: string): c is keyof typeof COLUMN_INDEXES {
  return c in COLUMN_INDEXES;
}
