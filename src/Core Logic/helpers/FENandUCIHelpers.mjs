import {
  BLACK,
  BLACK_KINGSIDE,
  BLACK_QUEENSIDE,
  COLUMN_INDEXES,
  COLUMN_SYMBOLS,
  GENERAL_SYMBOLS,
  PIECE_INDEXES,
  PIECE_SYMBOLS,
  WHITE,
  WHITE_KINGSIDE,
  WHITE_QUEENSIDE,
} from "../constants.mjs";
import { getAllLegalMoves } from "../moveGeneration/allMoveGeneration.mjs";
import { pieceAt } from "../pieceGetters.mjs";

/**
 * Converts bitboards to a FEN string
 *
 * @param {BigUint64Array} bitboards - bitboards of the position
 * @param {0|1} player - whose move it is (0 for w, 1 for b)
 * @param {Array<boolean>} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @return {string} - the FEN
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
      const piece = pieceAt[square];

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

  const castling = castlingRights
    ? (castlingRights[WHITE_KINGSIDE] ? "K" : "") +
        (castlingRights[WHITE_QUEENSIDE] ? "Q" : "") +
        (castlingRights[BLACK_KINGSIDE] ? "k" : "") +
        (castlingRights[BLACK_QUEENSIDE] ? "q" : "") || "-"
    : "-";

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
  // Normal rank starts at 1, so add one
  const rank = Math.floor(square / 8) + 1;
  const col = square % 8;

  return "" + COLUMN_SYMBOLS[col] + rank;
}

/**
 * Converts a uci move into a move object
 *
 * @param {string} uciMove - the uci move to get the move object for
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {0|1} player - the player whose move it is
 * @param {Array<boolean>} casRights - the castling rights
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

/**
 * Converts a move object into UCI notation
 * @param {Move} move - the move
 * @returns {string} - the move in uci form
 */
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
  const res = await fetch(`${import.meta.env.BASE_URL}openings.json`);
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

/**
 * Converts the castling rights section of a FEN into an array
 * of 4 booleans, on for each castling direction. In the order
 * white kingside, white queenside, black kingside, black queenside
 *
 * @param {string} rights - the castling rights string
 * @returns {Array<boolean>}
 */
function castlingRightsFromFEN(rights) {
  const castlingRights = [
    false, // White kingside
    false, // White queenside
    false, // Black kingside
    false, // Black queenside
  ];

  const charToRights = {
    K: WHITE_KINGSIDE,
    Q: WHITE_QUEENSIDE,
    k: BLACK_KINGSIDE,
    q: BLACK_QUEENSIDE,
  };

  if (rights === "-") return castlingRights;

  for (let i = 0; i < rights.length; i++) {
    const char = rights.charAt(i);
    castlingRights[charToRights[char]] = true;
  }
  return castlingRights;
}

/**
 * Converts the en passant section of a FEN into the index of the sqare (0-63).
 *
 * @param {string} algebraicEp - the algebraic representation of the square (Ex: a3)
 * @returns {number} - the index of the square
 */
function epFromFEN(algebraicEp) {
  if (algebraicEp === "-") return null;

  return squareToIndex(algebraicEp);
}

/**
 * Gets the player from the player section of a FEN string
 * @param {string} player - the player section of the FEN ("w" or "b")
 * @returns {0 | 1} - the player, with 0 being white and 1 being black
 */
function playerFromFEN(player) {
  if (player === "w") return WHITE;
  return BLACK;
}

/**
 * Gets all relevant data from a FEN string. Specifically the bitboards,
 * player, castling rights, and en passant square.
 * @param {string} fen - the FEN string
 * @returns {Object} an object with fields bitboards, player,
 * castling (the castling rights), and ep (for en passant)
 */
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
