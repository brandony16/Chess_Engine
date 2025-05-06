import { isInCheck } from "./bbChessLogic";
import { BLACK, COLUMN_SYMBOLS, GENERAL_SYMBOLS, WHITE } from "./constants";
import { getAllLegalMoves } from "./moveGeneration/allMoveGeneration";
import { getPieceAtSquare } from "./pieceGetters";

/**
 * @typedef {object} CastlingRights
 * @property {boolean} whiteKingside - Whether castling kingside is legal for white
 * @property {boolean} whiteQueenside - Whether castling queenside is legal for white
 * @property {boolean} blackKingside - Whether castling kingside is legal for black
 * @property {boolean} blackQueenside - Whether castling queenside is legal for black
 */

/**
 * Slides a specified direction until it hits a piece.
 *
 * @param {bigint} pieceBitboard - the bitboard with a 1 where the piece is. Only 1 bit should be set
 * @param {bigint} shift - the number of bits to shift. Left: -1, Right: 1, Up: 8, Down: -8
 * @param {bigint} mask - the mask to apply to ensure the moves stay on the board and don't loop around to the other side
 * @param {bigint} allPieces - a bitboard of all the pieces.
 * @returns {bigint} moves along the given ray
 */
export const slide = (pieceBitboard, shift, mask, allPieces) => {
  let attack = 0n;
  let pos = pieceBitboard;

  while (true) {
    pos = (pos & mask) << shift;

    if (!pos || pos === 0n) break; // Stop if no valid position remains

    if (pos & allPieces) {
      // Stop at the first occupied square
      attack |= pos;
      break;
    }

    attack |= pos;
  }

  return attack;
};

/**
 * Converts a big int to an 8x8 grid of 1s and 0s.
 * Used for debugging to be able to see what bits are and aren't flipped.
 *
 * @param {bigint} bitboard - the bitboard to count the pieces of
 * @returns {string} bitboard as a string in a 8x8 grid
 */
export const bigIntFullRep = (bitboard) => {
  let boardStr = "";

  for (let rank = 7; rank >= 0; rank--) {
    // Ranks go from 8 (top) to 1 (bottom)
    let row = "";
    for (let file = 0; file < 8; file++) {
      // Files go from A (left) to H (right)
      let square = BigInt(1) << BigInt(rank * 8 + file);
      row += bitboard & square ? "1 " : "0 ";
    }
    boardStr += row.trim() + "\n"; // Add each row to the board string
  }

  return boardStr;
};

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
  promotionPiece = null
) => {
  let notation = "";

  const col = to % 8;
  const letterCol = COLUMN_SYMBOLS[col];
  const row = (to - col) / 8;
  const piece = getPieceAtSquare(to, bitboards);
  const formattedPiece = GENERAL_SYMBOLS[piece];

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

  if (isInCheck(bitboards, opponent)) {
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


export function areBigUint64ArraysEqual(a, b) {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}