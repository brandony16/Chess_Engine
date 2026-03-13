import {
  FILE_SYMBOLS,
  NO_PIECE,
  PIECE_SYMBOLS,
} from "../game/chessConstants.ts";
import { getFile, getRank } from "../game/helpers/boardUtils.ts";
import type { Move } from "../game/moveMaking/move.ts";
import { isPawn } from "../game/pieceUtils/pieceClassifiers.ts";

/**
 * Turns a move into normal, readable chess notation. Currently does NOT disambiguate,
 * which is when two or more of the same piece can move to the same square.
 */
export const moveToAlgebraic = (
  move: Move,
  oppInCheck?: boolean,
  oppMated?: boolean,
) => {
  let notation = "";

  const { from, to } = move;

  const rank = getRank(to);
  const file = getFile(to);
  const fileSymbol = FILE_SYMBOLS[file];

  const piece = move.piece;
  const pieceSymbol = PIECE_SYMBOLS[piece];

  // Caslting case
  if (move.castling) {
    if (from - to === 2) {
      return "O-O-O";
    } else {
      return "O-O";
    }
  }

  if (isPawn(piece)) {
    // Pawns notation omits the p identifier. a3 instead of Pa3, dxe5 instead of pxe5
    if (move.captured !== NO_PIECE) {
      const fileFrom = getFile(from);
      notation += FILE_SYMBOLS[fileFrom] + "x";
    }
    notation += fileSymbol + (rank + 1); // +1 so rank is not 0-indexed (start at rank 1, not 0)

    if (move.promotion !== NO_PIECE) {
      notation += "=" + PIECE_SYMBOLS[move.promotion];
    }
  } else {
    notation += pieceSymbol;

    if (move.captured !== NO_PIECE) notation += "x";

    notation += fileSymbol + (rank + 1);
  }

  if (oppInCheck) {
    if (oppMated) {
      // Checkmate
      notation += "#";
      return notation;
    }
    notation += "+";
  }

  return notation;
};

/**
 * Converts an array of moves into a bitboard showing all moves.
 * Helpful for displaying the moves when a player clicks a square.
 */
export const movesToBB = (moves: Move[]) => {
  let bitboard = 0n;

  for (const move of moves) {
    bitboard |= 1n << BigInt(move.to);
  }

  return bitboard;
};
