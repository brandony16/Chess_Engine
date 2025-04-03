import { isInCheck } from "./bbChessLogic";
import {
  getAllIndividualLegalMoves,
  getAllLegalMoves,
} from "./bbMoveGeneration";

// Inital bitboards
export const initialBitboards = {
  whitePawns: BigInt("0x000000000000FF00"),
  whiteKnights: BigInt("0x0000000000000042"),
  whiteBishops: BigInt("0x0000000000000024"),
  whiteRooks: BigInt("0x0000000000000081"),
  whiteQueens: BigInt("0x0000000000000008"),
  whiteKings: BigInt("0x0000000000000010"),
  blackPawns: BigInt("0x00FF000000000000"),
  blackKnights: BigInt("0x4200000000000000"),
  blackBishops: BigInt("0x2400000000000000"),
  blackRooks: BigInt("0x8100000000000000"),
  blackQueens: BigInt("0x0800000000000000"),
  blackKings: BigInt("0x1000000000000000"),
};

// MASKS

export const FILE_H_MASK = 0x7f7f7f7f7f7f7f7fn;
export const FILE_A_MASK = 0xfefefefefefefefen;
export const RANK_8_MASK = 0x00ffffffffffffffn;
export const RANK_1_MASK = 0xffffffffffffff00n;

// Gets the white bitboards
export const getWhiteBitboards = (bitboards) => {
  return {
    whitePawns: bitboards.whitePawns,
    whiteKnights: bitboards.whiteKnights,
    whiteBishops: bitboards.whiteBishops,
    whiteRooks: bitboards.whiteRooks,
    whiteQueens: bitboards.whiteQueens,
    whiteKings: bitboards.whiteKings,
  };
};

export const getWhitePieces = (bitboards) => {
  return (
    bitboards.whitePawns |
    bitboards.whiteKnights |
    bitboards.whiteBishops |
    bitboards.whiteRooks |
    bitboards.whiteQueens |
    bitboards.whiteKings
  );
};

// Gets the black bitboards
export const getBlackBitboards = (bitboards) => {
  return {
    blackPawns: bitboards.blackPawns,
    blackKnights: bitboards.blackKnights,
    blackBishops: bitboards.blackBishops,
    blackRooks: bitboards.blackRooks,
    blackQueens: bitboards.blackQueens,
    blackKings: bitboards.blackKings,
  };
};

export const getBlackPieces = (bitboards) => {
  return (
    bitboards.blackPawns |
    bitboards.blackKnights |
    bitboards.blackBishops |
    bitboards.blackRooks |
    bitboards.blackQueens |
    bitboards.blackKings
  );
};

export const getAllPieces = (bitboards) => {
  return BigInt(getWhitePieces(bitboards) | getBlackPieces(bitboards));
};

export const getPlayerBoard = (player, bitboards) => {
  return player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);
};

export const getEmptySquares = (bitboards) => {
  return ~(getWhitePieces(bitboards) | getBlackPieces(bitboards));
};

// Converts the pieces to the correct string for the cell class rendering
export const pieceSymbols = {
  whitePawns: "P",
  whiteKnights: "N",
  whiteBishops: "B",
  whiteRooks: "R",
  whiteQueens: "Q",
  whiteKings: "K",
  blackPawns: "p",
  blackKnights: "n",
  blackBishops: "b",
  blackRooks: "r",
  blackQueens: "q",
  blackKings: "k",
};

export const generalSymbols = {
  whitePawns: "P",
  whiteKnights: "N",
  whiteBishops: "B",
  whiteRooks: "R",
  whiteQueens: "Q",
  whiteKings: "K",
  blackPawns: "P",
  blackKnights: "N",
  blackBishops: "B",
  blackRooks: "R",
  blackQueens: "Q",
  blackKings: "K",
}

export const colSymbols = {
  0: "a",
  1: "b",
  2: "c",
  3: "d",
  4: "e",
  5: "f",
  6: "g",
  7: "h",
};

// Function to get the piece at a given square
export const getPieceAtSquare = (square, bitboards) => {
  for (const [piece, bitboard] of Object.entries(bitboards)) {
    if ((bitboard >> BigInt(square)) & BigInt(1)) {
      return piece;
    }
  }

  return null;
};

export const isPlayersPieceAtSquare = (player, square, bitboards) => {
  const playerBoard = getPlayerBoard(player, bitboards);

  // Move square to first bit and check if it is one
  return Boolean((playerBoard >> BigInt(square)) & BigInt(1));
};

// Slides along a given shift
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

export const bitScanForward = (bitboard) => {
  if (bitboard === 0n) return -1;
  let index = 0;
  while ((bitboard & 1n) === 0n) {
    bitboard >>= 1n;
    index++;
  }
  return index;
};

export const getNumPieces = (bitboard) => {
  let count = 0;

  while (bitboard) {
    bitboard &= bitboard - 1n;
    count++;
  }

  return count;
};

// Zobrist Hashing. Stores each postion as a unique key
// Creates a unique bitstring for every piece at every square
// 64 Squares and 12 bitboards, KQRBNP for each side
export const zobristTable = new Array(12)
  .fill(null)
  .map(() =>
    new Array(64)
      .fill(null)
      .map(() => BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)))
  );

// Computes the hash given the bitboards and the player to move.
// Positions are NOT the same if the pieces are the same but whose move it is is different.
// Positions are NOT the same if en passant was legal but is no longer legal.
export const computeHash = (bitboards, player, enPassant) => {
  let hash = 0n;

  for (const [piece, bitboard] of Object.entries(bitboards)) {
    const pieceToZobrist = pieceToZobristIndex[piece];
    for (let square = 0; square < 64; square++) {
      if ((bitboard >> BigInt(square)) & 1n) {
        hash ^= zobristTable[pieceToZobrist][square]; // XOR with zobrist value
      }
    }
  }

  // XOR a value for the side to move
  const whiteToMove = 0x9d39247e33776d41n;
  if (player === "w") {
    hash ^= whiteToMove;
  }

  // Value for if enPassant is legal
  const enPassantValue = 0xf3a9b72c85d614e7n;
  if (enPassant) {
    hash ^= enPassantValue;
  }

  return hash;
};

export const pieceToZobristIndex = {
  whitePawns: 0,
  whiteKnights: 1,
  whiteBishops: 2,
  whiteRooks: 3,
  whiteQueens: 4,
  whiteKings: 5,
  blackPawns: 6,
  blackKnights: 7,
  blackBishops: 8,
  blackRooks: 9,
  blackQueens: 10,
  blackKings: 11,
};

// Helpers to get and turn a move into readable notation
// These are for AFTER the move is made.
// Currently does NOT disambiguate. (If two of same piece can move to square)
export const moveToReadable = (
  bitboards,
  from,
  to,
  isCapture = false,
  promotionPiece = null
) => {
  let notation = "";

  const col = to % 8;
  const letterCol = colSymbols[col];
  const row = (to - col) / 8;
  const piece = getPieceAtSquare(to, bitboards);
  const formattedPiece = pieceSymbols[piece].toUpperCase();

  const player = piece.charAt(0); // Every bitboard starts with either w (white) or b (black)
  const opponent = player === "w" ? "b" : "w";

  if (formattedPiece === "P" || promotionPiece) {
    // Pawns notation omits the p identifier. a3 instead of Pa3, dxe5 instead of pxe5
    if (isCapture) {
      const fromCol = from % 8;
      notation += colSymbols[fromCol] + "x";
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
    if (
      getAllLegalMoves(bitboards, player === "w" ? "b" : "w", null, null) === 0n
    ) {
      // Checkmate
      notation += "#";
      return notation;
    }
    notation += "+";
  }

  return notation;
};

export const allLegalMovesArr = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare
) => {
  const moves = getAllIndividualLegalMoves(
    bitboards,
    player,
    castlingRights,
    enPassantSquare
  );

  const promotionFromRank = player === "w" ? 6 : 1;
  const promotionPieces = ["Queens", "Rooks", "Knights", "Bishops"];

  let possibleMoves = [];
  for (const from in moves) {
    let moveBitboard = moves[from];

    const formattedPiece =
      pieceSymbols[getPieceAtSquare(from, bitboards)].toUpperCase();
    const row = Math.floor(parseInt(from) / 8);
    const isPromotion =
      row === promotionFromRank && formattedPiece === "P";

    while (moveBitboard !== 0n) {
      const moveTo = bitScanForward(moveBitboard);

      if (isPromotion) {
        promotionPieces.forEach((piece) => {
          possibleMoves.push({
            from: parseInt(from),
            to: moveTo,
            promotion: piece,
          });
        });
      } else {
        possibleMoves.push({
          from: parseInt(from),
          to: moveTo,
          promotion: null,
        });
      }
      moveBitboard &= moveBitboard - 1n;
    }
  }

  return possibleMoves;
};
