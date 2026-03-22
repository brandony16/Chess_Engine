import {
  BK,
  BLACK,
  BQ,
  FILE_SYMBOLS,
  isCastlingNumber,
  NO_PIECE,
  NO_SQUARE,
  PIECE_INDEXES,
  PIECE_N,
  PIECE_SYMBOLS,
  sq,
  WHITE,
  WK,
  WQ,
  type CastlingNumber,
  type Piece,
  type Player,
  type Square,
} from "../chessConstants.ts";
import { getFile, getRank } from "../helpers/boardUtils.ts";

export type AlgebraicSquare = keyof typeof sq;

export function isAlgebraicSquare(s: string): s is AlgebraicSquare {
  return s.toUpperCase() in sq;
}

function isValidPieceChar(c: string): c is keyof typeof PIECE_INDEXES {
  return c in PIECE_INDEXES;
}

// ---- FEN STRING FROM POSITION -----
export const buildFenBoard = (pieceAt: Int8Array): String => {
  const ranks = [];
  for (let rank = 7; rank >= 0; rank--) {
    let rankFEN = "";
    let emptyCount = 0;

    for (let file = 0; file < 8; file++) {
      const square = rank * 8 + file;
      const piece = pieceAt[square];

      if (piece === NO_PIECE) {
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

  return ranks.join("/");
};

export const buildFenCastling = (rights: number): String => {
  if (rights === 0) return "-";

  let rightsString = "";
  rightsString += rights & WK ? "K" : "";
  rightsString += rights & WQ ? "Q" : "";
  rightsString += rights & BK ? "k" : "";
  rightsString += rights & BQ ? "q" : "";

  return rightsString;
};

export const buildFenEnPassant = (epSquare: Square): String => {
  if (epSquare === NO_SQUARE) return "-";

  // Rank starts at 1, so add one
  const rank = getRank(epSquare) + 1;
  const file = getFile(epSquare);

  return "" + FILE_SYMBOLS[file] + rank;
};

// ----- POSITION FROM FEN STRING -----
/**
 * Converts the position part of a FEN into a bitboards array
 */
export function buildBitboards(bbString: String): BigUint64Array {
  let bitboards = new BigUint64Array(PIECE_N).fill(0n);

  const ranks = bbString.split("/");

  for (let i = 0; i < 8; i++) {
    const rank = ranks[i];
    let file = 0;

    for (let j = 0; j < rank.length; j++) {
      const ch = rank.charAt(j);
      if (/\d/.test(ch)) {
        // Skip digits (empty squares)
        file += parseInt(ch, 10);
      } else {
        if (!isValidPieceChar(ch)) {
          throw new Error(`Invalid piece character ${ch}`);
        }
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
 * Converts the castling rights section of a FEN into a 4 bit number.
 */
export function buildCastlingRights(rights: String): CastlingNumber {
  if (rights === "-") return 0;

  let castlingRights = 0;

  const charToRights = {
    K: WK,
    Q: WQ,
    k: BK,
    q: BQ,
  };
  function isValidCastlingChar(c: string): c is keyof typeof charToRights {
    return c in charToRights;
  }

  for (let i = 0; i < rights.length; i++) {
    const char = rights.charAt(i);
    if (!isValidCastlingChar(char)) {
      throw new Error(`Invalid castling char ${char}`);
    }
    castlingRights |= charToRights[char];
  }

  if (!isCastlingNumber(castlingRights)) {
    throw new Error("Castling rights overflowed 4 bits");
  }

  return castlingRights;
}

/**
 * Converts the en passant section of a FEN into the index of the sqare (0-63).
 */
export function buildEnPassantSquare(algebraicEp: string): Square {
  if (algebraicEp === "-") return NO_SQUARE;

  const upper = algebraicEp.toUpperCase();

  if (!isAlgebraicSquare(upper)) {
    throw new Error(`Invalid square: ${algebraicEp}`);
  }

  return sq[upper];
}

/**
 * Gets the player from the player section of a FEN string
 */
export function buildPlayer(player: string): Player {
  return player === "w" ? WHITE : BLACK;
}
