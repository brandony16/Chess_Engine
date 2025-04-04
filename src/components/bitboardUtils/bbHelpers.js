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

/**
 * Gets the white piece bitboards
 *
 * @param {bigint} bitboards
 *                the bitboards of the current position
 * @returns {object} white bitboards
 */
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

/**
 * Gets the white pieces in one bitboard
 *
 * @param {bigint} bitboards
 *                the bitboards of the current position
 * @returns {bigint} all white pieces
 */
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

/**
 * Gets the black piece bitboards
 *
 * @param {bigint} bitboards
 *                the bitboards of the current position
 * @returns {object} black bitboards
 */
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

/**
 *
 * @param {bigint} bitboards
 *                the bitboards of the current positiion
 * @returns {bigint} all black pieces
 */
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

/**
 * Gets all the pieces on one bitboard
 *
 * @param {bigint} bitboards
 *                the bitboards of the current position
 * @returns {bigint} all pieces
 */
export const getAllPieces = (bitboards) => {
  return BigInt(getWhitePieces(bitboards) | getBlackPieces(bitboards));
};

/**
 * Gets the bitboard of a specific player's pieces
 *
 * @param {string} player
 *                the player whose move it is ("w" or "b")
 * @param {bigint} bitboards
 *                the bitboards of the current position
 * @returns bitboard of players pieces
 */
export const getPlayerBoard = (player, bitboards) => {
  return player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);
};

/**
 * Gets all the empty squares
 *
 * @param {bigint} bitboards
 *                bitboards of the current position
 * @returns {bigint} bitboard of empty squares
 */
export const getEmptySquares = (bitboards) => {
  return ~(getWhitePieces(bitboards) | getBlackPieces(bitboards));
};

/**
 * Converts the pieces to the correct character. Uppercase is white, lowercase is black.
 */
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

/**
 * Converts the pieces to the correct character independent of player. Uppercase for all
 */
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
};

/**
 * Converts columns to their corresponding letter form
 */
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

/**
 * Gets a piece at a specific square
 *
 * @param {number} square
 *                the square to find the piece at
 * @param {bigint} bitboards
 *                the bitboards of the current position
 * @returns {string} piece at the square
 */
export const getPieceAtSquare = (square, bitboards) => {
  for (const [piece, bitboard] of Object.entries(bitboards)) {
    if ((bitboard >> BigInt(square)) & BigInt(1)) {
      return piece;
    }
  }

  return null;
};

/**
 * Determines if a given player has a piece at the given square.
 *
 * @param {string} player
 *                the player whose move it is ("w" or "b")
 * @param {number} square
 *                the square to find the piece at
 * @param {bigint} bitboards
 *                the bitboards of the current position
 * @returns {boolean} true if players piece is at the square
 */
export const isPlayersPieceAtSquare = (player, square, bitboards) => {
  const playerBoard = getPlayerBoard(player, bitboards);

  // Move square to first bit and check if it is one
  return Boolean((playerBoard >> BigInt(square)) & BigInt(1));
};

/**
 * Slides a specified direction until it hits a piece.
 *
 * @param {bigint} pieceBitboard
 *                the bitboard with a 1 where the piece is. Only 1 bit should be set
 * @param {bigint} shift
 *                the number of bits to shift. Left: -1, Right: 1, Up: 8, Down: -8
 * @param {bigint} mask
 *                the mask to apply to ensure the moves stay on the board and don't loop around to the other side
 * @param {bigint} allPieces
 *                a bitboard of all the pieces.
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
 * @param {bigint} bitboard
 *                the bitboard to count the pieces of
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
 * Iterates over a bitboard and finds the first square that is a 1. Returns that index.
 *
 * @param {bigint} bitboard
 *                the bitboard to count the pieces of
 * @returns {number} index of least signifigant bit
 */
export const bitScanForward = (bitboard) => {
  if (bitboard === 0n) return -1;
  let index = 0;
  while ((bitboard & 1n) === 0n) {
    bitboard >>= 1n;
    index++;
  }
  return index;
};

/**
 * Gets the number of pieces a bitboard has. Counts each signifigant bit.
 *
 * @param {bigint} bitboard
 *                the bitboard to count the pieces of
 * @returns {number} number of pieces
 */
export const getNumPieces = (bitboard) => {
  let count = 0;

  while (bitboard) {
    bitboard &= bitboard - 1n;
    count++;
  }

  return count;
};

/**
 * Zobrist table for hashing. Creates a unique bitstring for every piece at every square.
 * 64 Squares and 12 bitboards each, KQRBNP for each side.
 */
export const zobristTable = new Array(12)
  .fill(null)
  .map(() =>
    new Array(64)
      .fill(null)
      .map(() => BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)))
  );

/**
 * Computes a hash given the bitboards, the player whose turn it is, and an enPassantSquare.
 * Positions are NOT the same if the pieces are the same but it is a different players turn.
 * Positions are also NOT the same if en passant was legal before, but is no longer legal.
 *
 * @param {bigint} bitboards
 *                the bitboards of the current position
 * @param {string} player
 *                the player whose move it is ("w" or "b")
 * @param {number} enPassant
 *                the en passant square. None assumes it is not legal.
 * @returns {bigint} hash for the position
 */
export const computeHash = (bitboards, player, enPassant = null) => {
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
  if (player === "w") {
    hash ^= PLAYER_ZOBRIST;
  }

  // Value for if enPassant is legal
  if (enPassant) {
    hash ^= EN_PASSANT_ZOBRIST;
  }

  return hash;
};

/**
 * Updates the previous hash. Is more efficient than computeHash as it only changes what it needs to for the new hash.
 * Compute hash redoes every calculation every time, which is inefficient, especially when only a few things have
 * changed since the last position.
 *
 * @param {bigint} prevBitboards
 *                bitboards before the move
 * @param {bigint} bitboards
 *                bitboards after the move
 * @param {number} to
 *                where the piece moved to
 * @param {number} from
 *                where the piece moved from
 * @param {boolean} enPassantChanged
 *                whether en passant has changed from legal to not legal or vice versa compared to the previous position.
 * @param {bigint} prevHash
 *                the hash from the previous position
 * @returns {bigint} the new hash
 */
export const updateHash = (
  prevBitboards,
  bitboards,
  to,
  from,
  enPassantChanged,
  prevHash
) => {
  let newHash = prevHash;
  let pieceFrom = getPieceAtSquare(from, prevBitboards);

  // XOR the piece at the previous position
  const zobristFromIndex = pieceToZobristIndex[pieceFrom];
  const zobristFrom = zobristTable[zobristFromIndex][from];
  newHash ^= zobristFrom;

  // XOR the pieces new location
  const pieceTo = getPieceAtSquare(to, bitboards);
  const zobristToIndex = pieceToZobristIndex[pieceTo];
  const zobristTo = zobristTable[zobristToIndex][to];
  newHash ^= zobristTo;

  // if a capture, XOR to remove captured piece
  const prevPieceTo = getPieceAtSquare(to, prevBitboards);
  if (prevPieceTo) {
    const zobristCapturedIndex = pieceToZobristIndex[prevPieceTo];
    const zobristCaptured = zobristTable[zobristCapturedIndex][to];
    newHash ^= zobristCaptured;
  }

  // XOR player
  newHash ^= PLAYER_ZOBRIST;

  if (enPassantChanged) {
    newHash ^= EN_PASSANT_ZOBRIST;
  }

  return newHash;
};

// Random big ints to generate distinct hashes for when it is one players turn and when en passant is legal.
export const PLAYER_ZOBRIST = 0x9d39247e33776d41n;
export const EN_PASSANT_ZOBRIST = 0xf3a9b72c85d614e7n;

/**
 * Converts a piece type to the corresponding index for that piece in the zobrist table
 */
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

/**
 * Turns a move into normal, readable chess notation. Currently does NOT disambiguate,
 * which is when two or more of the same piece can move to the same square.
 *
 * @param {bigint} bitboards
 *                bitboards of the position AFTER the move is made
 * @param {number} from
 *                the square the piece moved from
 * @param {number} to
 *                the square to piece moved to
 * @param {boolean} isCapture
 *                whether or not the move captured a piece
 * @param {string} promotionPiece
 *                the piece the pawn was promoted to, if there is one.
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

/**
 * Gets all the legal moves and returns them in an array. Moves are formatted as objects,
 * with from, to, and promotion fields. Helpful for sorting
 *
 * @param {bigint} bitboards
 *                the bitboards of the current position
 * @param {string} player
 *                the player whose move it is ("w" or "b")
 * @param {object} castlingRights
 *                the castling rights for the game. Should have boolean fields whiteKingside, whiteQueenside,
 *                blackKingside, blackQueenside
 * @param {number} enPassantSquare
 *                the square, if any, that a pawn could do en passant
 * @returns all legal moves in an array format
 */
export const allLegalMovesArr = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare = null
) => {
  const moves = getAllIndividualLegalMoves(
    bitboards,
    player,
    castlingRights,
    enPassantSquare
  );
  const isWhite = player === "w";
  const promotionFromRank = isWhite ? 6 : 1;
  const promotionPieces = ["Queens", "Rooks", "Knights", "Bishops"];

  let possibleMoves = [];
  for (const from in moves) {
    let moveBitboard = moves[from];

    const formattedPiece =
      pieceSymbols[getPieceAtSquare(from, bitboards)].toUpperCase();
    const row = Math.floor(parseInt(from) / 8);
    const isPromotion = row === promotionFromRank && formattedPiece === "P";

    while (moveBitboard !== 0n) {
      const moveTo = bitScanForward(moveBitboard);

      let isCapture = false;
      if (isPlayersPieceAtSquare(isWhite ? "b" : "w", moveTo, bitboards)) {
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
