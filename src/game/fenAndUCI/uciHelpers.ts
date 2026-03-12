import {
  FILE_INDEXES,
  FILE_SYMBOLS,
  isValidFileChar,
  NO_PIECE,
  PIECE_INDEXES,
  PIECE_SYMBOLS,
  WHITE,
  type Piece,
  type Square,
} from "../chessConstants.ts";
import { getFile, getRank } from "../helpers/boardUtils.ts";
import {
  moveFrom,
  movePromotion,
  moveTo,
  type Move,
} from "../moveMaking/move.ts";
import type { Position } from "../Position.ts";
import { isAlgebraicSquare } from "./fenHelpers.ts";

/**
 * Converts a move object into UCI notation
 */
export function moveToUCI(move: Move): string {
  const from = indexToSquare(moveFrom(move));
  const to = indexToSquare(moveTo(move));
  const promo =
    movePromotion(move) !== NO_PIECE
      ? PIECE_SYMBOLS[movePromotion(move)].toLowerCase()
      : "";

  return from + to + promo;
}

function indexToSquare(index: Square): string {
  const file = getFile(index);
  const rank = getRank(index);

  const fileSymbol = FILE_SYMBOLS[file];

  return fileSymbol + (rank + 1);
}

/**
 * Converts a uci move into a move object
 *
 */
export function uciToMove(uciMove: string, pos: Position) {
  if (uciMove.length < 4 || uciMove.length > 5) {
    throw new Error(`Invalid uciMove: ${uciMove}`);
  }

  const sq1 = uciMove.slice(0, 2);
  const sq2 = uciMove.slice(2, 4);

  if (!isAlgebraicSquare(sq1) || !isAlgebraicSquare(sq2)) {
    throw new Error(`Ivalid uciMove: ${uciMove}`);
  }

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

  const numLegal = pos.generateLegalMoves();
  for (let i = 0; i < numLegal; i++) {
    const move = pos.moveBuffer[i];
    if (
      from === moveFrom(move) &&
      to === moveTo(move) &&
      promotion === movePromotion(move)
    ) {
      return move;
    }
  }

  throw new Error("UCI move not found");
}

function isValidPieceChar(c: string): c is keyof typeof PIECE_INDEXES {
  return c in PIECE_INDEXES;
}

function squareToIndex(square: string) {
  const file = square.charAt(0);
  const rank = square.charAt(1);

  if (!isValidFileChar(file)) {
    throw new Error(`Invalid file: ${file}`);
  }

  const rankNum = parseInt(rank) - 1;
  const fileNum = FILE_INDEXES[file];

  return rankNum * 8 + fileNum;
}
