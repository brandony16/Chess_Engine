import {
  BK,
  BLACK,
  BQ,
  COLUMN_INDEXES,
  COLUMN_SYMBOLS,
  NO_PIECE,
  NO_SQUARE,
  NUM_PIECES,
  PIECE_INDEXES,
  PIECE_SYMBOLS,
  WHITE,
  WK,
  WQ,
  type Piece,
  type Player,
  type Square,
} from "../chessConstants.ts";

// ---- FEN STRING FROM POSITION -----
export const buildFenBoard = (pieceAt: Piece[]): String => {
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
  const rank = Math.floor(epSquare / 8) + 1;
  const col = epSquare % 8;

  return "" + COLUMN_SYMBOLS[col] + rank;
};

// ----- POSITION FROM FEN STRING -----
/**
 * Converts the position part of a FEN into a bitboards array
 */
export function buildBitboards(bbString: String): BigUint64Array {
  let bitboards = new BigUint64Array(NUM_PIECES).fill(0n);

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

function isValidPieceChar(c: string): c is keyof typeof PIECE_INDEXES {
  return c in PIECE_INDEXES;
}

/**
 * Converts the castling rights section of a FEN into a 4 bit number.
 */
export function buildCastlingRights(rights: String): number {
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
  return castlingRights;
}

/**
 * Converts the en passant section of a FEN into the index of the sqare (0-63).
 */
export function buildEnPassantSquare(algebraicEp: String): Square {
  if (algebraicEp === "-") return NO_SQUARE;

  const col = algebraicEp.charAt(0);
  const row = algebraicEp.charAt(1);

  if (!isValidColChar(col)) {
    throw new Error(`Invalid column ${col}`);
  }
  
  const rowNum = parseInt(row) - 1; // Make row 0 indexed
  const colNum = COLUMN_INDEXES[col];

  return rowNum * 8 + colNum;
}

function isValidColChar(c: string): c is keyof typeof COLUMN_INDEXES {
  return c in COLUMN_INDEXES;
}

/**
 * Gets the player from the player section of a FEN string
 */
export function buildPlayer(player: String): Player {
  return player === "w" ? WHITE : BLACK;
}
