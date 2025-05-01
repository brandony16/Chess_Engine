import { isInCheck } from "./bbChessLogic";
import { bitScanForward } from "./bbUtils";
import {
  BLACK,
  COLUMN_SYMBOLS,
  GENERAL_SYMBOLS,
  WHITE,
  WHITE_PAWN,
} from "./constants";
import {
  getAllIndividualLegalMoves,
  getAllLegalMoves,
} from "./moveGeneration/allMoveGeneration";
import { getPieceAtSquare, isPlayersPieceAtSquare } from "./pieceGetters";

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
    if (getAllLegalMoves(bitboards, opponent, null, null) === 0n) {
      // Checkmate
      notation += "#";
      return notation;
    }
    notation += "+";
  }

  return notation;
};

/**
 * Gets all the legal moves and returns them in an array. Moves are formatted as objects,
 * with from, to, and promotion fields. Helpful for sorting
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {CastlingRights} castlingRights - the castling rights for the game. Should have
 * boolean fields whiteKingside, whiteQueenside, blackKingside, blackQueenside
 * @param {number} enPassantSquare - the square, if any, that a pawn could do en passant
 * @returns all legal moves in an array format
 */
export const allLegalMovesArr = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare = null,
  hash = null
) => {
  const moves = getAllIndividualLegalMoves(
    bitboards,
    player,
    castlingRights,
    enPassantSquare,
    hash
  );

  const isWhite = player === WHITE;
  const promotionFromRank = isWhite ? 6 : 1;
  const promotionPieces = [4, 3, 1, 2]; // Queen, Rook, Knight, Bishop

  let possibleMoves = [];
  for (const from in moves) {
    let moveBitboard = moves[from];

    const piece = getPieceAtSquare(from, bitboards);
    const formattedPiece = piece - 6 * player; // Player doesnt matter. Just need index 0-5
    const row = Math.floor(parseInt(from) / 8);

    const isPromotion =
      row === promotionFromRank && formattedPiece === WHITE_PAWN;

    while (moveBitboard !== 0n) {
      const moveTo = bitScanForward(moveBitboard);

      let isCapture = false;
      if (isPlayersPieceAtSquare(isWhite ? BLACK : WHITE, moveTo, bitboards)) {
        isCapture = true;
      }

      if (isPromotion) {
        promotionPieces.forEach((piece) => {
          possibleMoves.push({
            from: parseInt(from),
            to: moveTo,
            promotion: piece,
            isCapture: isCapture,
          });
        });
      } else {
        possibleMoves.push({
          from: parseInt(from),
          to: moveTo,
          promotion: null,
          isCapture: isCapture,
        });
      }
      moveBitboard &= moveBitboard - 1n;
    }
  }

  return possibleMoves;
};
