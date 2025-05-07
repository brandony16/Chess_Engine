import {
  COLUMN_INDEXES,
  COLUMN_SYMBOLS,
  PIECE_INDEXES,
  PIECE_SYMBOLS,
  WHITE,
} from "./constants";
import { getAllLegalMoves } from "./moveGeneration/allMoveGeneration";
import { getPieceAtSquare } from "./pieceGetters";

/**
 * Converts bitboards to a FEN string
 *
 * @param {BigUint64Array} bitboards - bitboards of the position
 * @param {0|1} player - whose move it is (0 for w, 1 for b)
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 */
export function bitboardsToFEN(
  bitboards,
  player,
  castlingRights,
  enPassantSquare
) {
  const ranks = [];
  for (let rank = 7; rank >= 0; rank--) {
    let rankFEN = "";
    let emptyCount = 0;

    for (let file = 0; file < 8; file++) {
      const square = rank * 8 + file;
      const piece = getPieceAtSquare(square, bitboards);

      if (piece === null) {
        emptyCount += 1;
      } else {
        if (emptyCount) {
          rankFEN += emptyCount;
          emptyCount = 0;
        }
        rankFEN += PIECE_SYMBOLS[piece];
      }
    }

    if (emptyCount) rankFEN += emptyCount;
    ranks.push(rankFEN);
  }

  const placement = ranks.join("/");

  const active = player === WHITE ? "w" : "b";

  const castling =
    (castlingRights.whiteKingside ? "K" : "") +
      (castlingRights.whiteQueenside ? "Q" : "") +
      (castlingRights.blackKingside ? "k" : "") +
      (castlingRights.blackQueenside ? "q" : "") || "-";

  const ep = enPassantSquare !== null ? indexToSquare(enPassantSquare) : "-";

  // Hardcoded as they are not needed for engine v engine
  const halfmove = "0";
  const fullmove = "1";

  return `${placement} ${active} ${castling} ${ep} ${halfmove} ${fullmove}`;
}

/**
 * Converts a square index into a string square. EX 8 => "a2"
 *
 * @param {number} square - the index of the square
 * @returns {string} the string representation of the square (a3)
 */
function indexToSquare(square) {
  // Rank isnt 0 indexed so add one
  const rank = Math.floor(square / 8) + 1;
  const col = square % 8;

  return "" + COLUMN_SYMBOLS[col] + rank;
}

/**
 * Picks a move from the entries array. The entries should have a move and wieght field.
 * Selects a move using a weighted algorithm, favoring more commonly played moves.
 *
 * @param {Array<Object>} entries - the entries from polyglot
 * @returns {string} the selected move in UCI form
 */
export function pickBookMove(entries) {
  // Sum all weights
  const total = entries.reduce((sum, e) => sum + e.weight, 0);

  let r = Math.random() * total;

  for (const { move, weight } of entries) {
    if (r < weight) {
      return move;
    }
    r -= weight;
  }

  // Should return before here if entries has a length
  throw new Error("No move found in entries.");
}

/**
 * Converts a uci move into a move object
 *
 * @param {string} uciMove - the uci move to get the move object for
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {0|1} player - the player whose move it is
 * @param {Object} casRights - the castling rights in the position
 * @param {number} epSquare - where en passant is legal
 * @returns {Move} the move
 */
export function uciToMove(uciMove, bitboards, player, casRights, epSquare) {
  const from = squareToIndex(uciMove.slice(0, 2));
  const to = squareToIndex(uciMove.slice(2, 4));
  const promotion = uciMove.length === 5 ? PIECE_INDEXES[uciMove[4]] : null;

  const legalMoves = getAllLegalMoves(bitboards, player, casRights, epSquare);

  for (const move of legalMoves) {
    if (from === move.from && to === move.to && promotion === move.promotion) {
      return move;
    }
  }

  throw new Error("UCI move not found");
}

/**
 * Converts a string square into the index of that square.
 *
 * @param {string} square - string rep of the square (a3)
 * @returns {number} index of the square
 */
function squareToIndex(square) {
  const col = square.charAt(0);
  const row = square.charAt(1);

  const rowNum = parseInt(row);
  const colNum = COLUMN_INDEXES[col];

  return rowNum * 8 + colNum;
}
