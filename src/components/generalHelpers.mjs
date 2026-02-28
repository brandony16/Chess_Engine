import { BLACK, WHITE } from "chess.js";
import { COLUMN_SYMBOLS, PIECE_SYMBOLS } from "../game/chessConstants.ts";
import { getAllLegalMoves } from "../game/moveGen/moveGeneration.ts";
import { pieceAt } from "../game/pieceUtils/pieceGetters.ts";

/**
 * Turns a move into normal, readable chess notation. Currently does NOT disambiguate,
 * which is when two or more of the same piece can move to the same square.
 *
 * @param {BigUint64Array} bitboards - bitboards of the position AFTER the move is made
 * @param {number} from - the square the piece moved from
 * @param {number} to - the square to piece moved to
 * @param {boolean} isCapture - whether or not the move captured a piece
 * @param {string} promotionPiece - the piece the pawn was promoted to, if there is one.
 * @returns the move in normal chess notation
 */
export const moveToReadable = (
  bitboards,
  from,
  to,
  isCapture = false,
  promotionPiece = null,
) => {
  let notation = "";

  const col = to % 8;
  const letterCol = COLUMN_SYMBOLS[col];
  const row = (to - col) / 8;
  const piece = pieceAt[to];
  const formattedPiece = PIECE_SYMBOLS[piece];

  // indexes 0-5 are white pieces, 6-11 are black pieces
  const opponent = piece > 5 ? WHITE : BLACK;

  if (formattedPiece === "P" || promotionPiece) {
    // Pawns notation omits the p identifier. a3 instead of Pa3, dxe5 instead of pxe5
    if (isCapture) {
      const fromCol = from % 8;
      notation += COLUMN_SYMBOLS[fromCol] + "x";
    }
    notation += letterCol + (row + 1);
  } else if (formattedPiece === "K" && Math.abs(from - to) === 2) {
    // Caslting case
    if (from - to === 2) {
      notation = "O-O-O";
    } else {
      notation = "O-O";
    }
  } else {
    notation += formattedPiece;

    if (isCapture) notation += "x";

    notation += letterCol + (row + 1);
  }

  if (promotionPiece) {
    notation += "=" + formattedPiece;
  }

  if (/* isInCheck(bitboards, opponent) */ opponent) {
    if (getAllLegalMoves(bitboards, opponent, null, null).length === 0) {
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
 *
 * @param {Array<Move>} moves - an array of moves
 * @returns {bigint} a move bitboard
 */
export const movesToBB = (moves) => {
  let bitboard = 0n;

  for (const move of moves) {
    bitboard |= 1n << BigInt(move.to);
  }

  return bitboard;
};
