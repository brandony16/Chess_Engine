import {
  BLACK,
  COLUMN_INDEXES,
  COLUMN_SYMBOLS,
  GENERAL_SYMBOLS,
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
  let promotion =
    uciMove.length === 5
      ? player === WHITE
        ? uciMove[4].toUpperCase()
        : uciMove[4]
      : null;
  if (promotion) {
    promotion = PIECE_INDEXES[promotion];
  }

  const legalMoves = getAllLegalMoves(bitboards, player, casRights, epSquare);

  for (const move of legalMoves) {
    if (from === move.from && to === move.to && promotion === move.promotion) {
      return move;
    }
  }

  throw new Error("UCI move not found");
}

export function moveToUCI(move) {
  const from = indexToSquare(move.from);
  const to = indexToSquare(move.to);
  const promo = move.promotion
    ? GENERAL_SYMBOLS[move.promotion].toLowerCase()
    : "";

  return from + to + promo;
}

/**
 * Converts a string square into the index of that square.
 *
 * @param {string} square - string rep of the square (a3)
 * @returns {number} index of the square
 */
export function squareToIndex(square) {
  const col = square.charAt(0);
  const row = square.charAt(1);

  const rowNum = parseInt(row) - 1; // Rows arent 0 indexed
  const colNum = COLUMN_INDEXES[col];

  return rowNum * 8 + colNum;
}

/**
 * Gets a sequence of 8 opening moves (ply) for engines to play from.
 * Used so engines don't play the same game every time.
 * @returns {Array<String>} - 8 opening moves
 */
export async function getOpeningMoves() {
  const res = await fetch("openings.json");
  if (!res.ok) throw new Error("Error fetching opening moves");

  const openings = await res.json();

  const randIndex = Math.floor(Math.random() * openings.length);

  return openings[randIndex];
}

/**
 * Converts the position part of a FEN into a bitboards array
 *
 * @param {string} bbString - the part of a FEN that stores the piece positions
 * @returns {BigUint64Array} - bitboards of the position
 */
function FENToBitboards(bbString) {
  let bitboards = new BigUint64Array(12).fill(0n);

  const rows = bbString.split("/");

  for (let i = 0; i < 8; i++) {
    const row = rows[i];
    let file = 0;

    for (let j = 0; j < row.length; j++) {
      const ch = row.charAt(j);
      if (/\d/.test(ch)) {
        // Skip digits (empty squares)
        file += parseInt(ch, 10);
      } else {
        const piece = PIECE_INDEXES[ch];
        // Fen is rank 8 first
        const square = BigInt(8 * (7 - i) + file);
        bitboards[piece] |= 1n << square;
        file++;
      }
    }
  }

  return bitboards;
}

function castlingRightsFromFEN(rights) {
  const castlingRights = {
    whiteKingside: false,
    whiteQueenside: false,
    blackKingside: false,
    blackQueenside: false,
  };

  const charToRights = {
    K: "whiteKingside",
    Q: "whiteQueenside",
    k: "blackKingside",
    q: "blackQueenside",
  };

  if (rights === "-") return castlingRights;

  for (let i = 0; i < rights.length; i++) {
    const char = rights.charAt(i);
    castlingRights[charToRights[char]] = true;
  }
  return castlingRights;
}

function epFromFEN(algebraicEp) {
  if (algebraicEp === "-") return null;

  return squareToIndex(algebraicEp);
}

function playerFromFEN(player) {
  if (player === "w") return WHITE;
  return BLACK;
}

export function getFENData(fen) {
  const data = fen.split(" ");
  const bbStr = data[0];
  const playerStr = data[1];
  const castlingStr = data[2];
  const epStr = data[3];

  const bitboards = FENToBitboards(bbStr);
  const player = playerFromFEN(playerStr);
  const castling = castlingRightsFromFEN(castlingStr);
  const ep = epFromFEN(epStr);

  return { bitboards, player, castling, ep };
}
