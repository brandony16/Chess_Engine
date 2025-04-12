import { isSquareAttacked } from "../bbChessLogic";
import { getPieceAtSquare, pieceSymbols } from "../generalHelpers";

/**
 * @typedef {object} Bitboards
 * @property {bigint} whitePawns - bitboard of the white pawns
 * @property {bigint} whiteKnights - bitboard of the white knights
 * @property {bigint} whiteBishops - bitboard of the white bishops
 * @property {bigint} whiteRooks - bitboard of the white rooks
 * @property {bigint} whiteQueens - bitboard of the white queens
 * @property {bigint} whiteKings - bitboard of the white king
 * @property {bigint} blackPawns - bitboard of the black pawns
 * @property {bigint} blackKnights - bitboard of the black knights
 * @property {bigint} blackBishops - bitboard of the black bishops
 * @property {bigint} blackRooks - bitboard of the black rooks
 * @property {bigint} blackQueens - bitboard of the black queens
 * @property {bigint} blackKings - bitboard of the black king
 */

/**
 * @typedef {object} CastlingRights
 * @property {boolean} whiteKingside - Whether castling kingside is legal for white
 * @property {boolean} whiteQueenside - Whether castling queenside is legal for white
 * @property {boolean} blackKingside - Whether castling kingside is legal for black
 * @property {boolean} blackQueenside - Whether castling queenside is legal for black
 */

/**
 * @typedef {Object} MoveResult
 * @property {object} bitboards - The updated bitboards after the move
 * @property {number} enPassantSquare - The square where enPassant is legal
 * @property {boolean} isCapture - Whether the move was a capture
 */

/**
 * Updates castling rights given the square moved from. If any rook or king moves, castling is updated.
 * Because they always start at squares 0, 4, 7, 56, 60, and 63; any move from these squares means the rights need to be updated.
 *
 * @param {number} from - the square the piece is moving from
 * @param {CastlingRights} prevRights - the rights to update. Has fields whiteKingside, whiteQueenside, blackKingside, blackQueenside
 * @returns {CastlingRights} the new castling rights
 */
export const updateCastlingRights = (from, prevRights) => {
  const newRights = { ...prevRights };

  // If a king moves, it loses castling rights
  if (from === 4) {
    newRights.whiteKingside = false;
    newRights.whiteQueenside = false;
  } else if (from === 60) {
    newRights.blackKingside = false;
    newRights.blackQueenside = false;
  }

  // If rooks move, disable their respective castling
  else if (from === 0) newRights.whiteQueenside = false;
  else if (from === 7) newRights.whiteKingside = false;
  else if (from === 56) newRights.blackQueenside = false;
  else if (from === 63) newRights.blackKingside = false;

  return newRights;
};

/* CASTLING FUNCTIONS */
/**
 * Determines whether a given player can castle kingside
 *
 * @param {Bitboards} bitboards - the current positions bitboards
 * @param {string} player - the player who is castling ("w" or "b")
 * @returns {boolean} whether the player can castle kingside
 */
export const isKingsideCastleLegal = (bitboards, player) => {
  let squares;
  let opponent;
  let playerKing;
  if (player === "w") {
    squares = [4, 5, 6];
    opponent = "b";
    playerKing = "K";
  } else {
    squares = [60, 61, 62];
    opponent = "w";
    playerKing = "k";
  }

  // Check if squares are empty or under attack
  for (let square of squares) {
    const piece = getPieceAtSquare(square, bitboards);
    if (piece !== null && pieceSymbols[piece] !== playerKing) {
      return false;
    }
    if (isSquareAttacked(bitboards, square, opponent)) {
      return false;
    }
  }

  return true;
};

/**
 * Determines whether a given player can castle queenside
 *
 * @param {Bitboards} bitboards - the current positions bitboards
 * @param {string} player - the player who is castling ("w" or "b")
 * @returns {boolean} whether the player can castle queenside
 */
export const isQueensideCastleLegal = (bitboards, player) => {
  let squares;
  let opponent;
  let playerKing;
  if (player === "w") {
    squares = [1, 2, 3, 4];
    opponent = "b";
    playerKing = "K";
  } else {
    squares = [57, 58, 59, 60];
    opponent = "w";
    playerKing = "k";
  }

  // Check if squares are empty or under attack
  for (let square of squares) {
    const piece = getPieceAtSquare(square, bitboards);
    if (piece !== null && pieceSymbols[piece] !== playerKing) {
      return false;
    }
    if (isSquareAttacked(bitboards, square, opponent)) {
      return false;
    }
  }

  return true;
};

/**
 * Executes a castling move and returns updated game state.
 *
 * @param {Bitboards} bitboards - The current position's bitboards.
 * @param {number} from - The square the king is moving from.
 * @param {number} to - The square the king is moving to.
 * @returns {MoveResult} An object containing the updated bitboards, null for enPassantSquare,and false for isCapture.
 */
export const makeCastleMove = (bitboards, from, to) => {
  let newBitboards = { ...bitboards };

  if (from === 4 && to === 6) {
    // White kingside castling
    newBitboards.whiteKings &= ~(1n << 4n);
    newBitboards.whiteKings |= 1n << 6n;
    newBitboards.whiteRooks &= ~(1n << 7n);
    newBitboards.whiteRooks |= 1n << 5n;
  } else if (from === 4 && to === 2) {
    // White queenside castling
    newBitboards.whiteKings &= ~(1n << 4n);
    newBitboards.whiteKings |= 1n << 2n;
    newBitboards.whiteRooks &= ~(1n << 0n);
    newBitboards.whiteRooks |= 1n << 3n;
  } else if (from === 60 && to === 62) {
    // Black kingside castling
    newBitboards.blackKings &= ~(1n << 60n);
    newBitboards.blackKings |= 1n << 62n;
    newBitboards.blackRooks &= ~(1n << 63n);
    newBitboards.blackRooks |= 1n << 61n;
  } else if (from === 60 && to === 58) {
    // Black queenside castling
    newBitboards.blackKings &= ~(1n << 60n);
    newBitboards.blackKings |= 1n << 58n;
    newBitboards.blackRooks &= ~(1n << 56n);
    newBitboards.blackRooks |= 1n << 59n;
  }
  return { bitboards: newBitboards, enPassantSquare: null, isCapture: false };
};
