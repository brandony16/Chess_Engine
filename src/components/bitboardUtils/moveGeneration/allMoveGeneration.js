import { filterIllegalMoves } from "./bbChessLogic";
import {
  bitScanForward,
  generalSymbols,
  getBlackPieces,
  getPieceAtSquare,
  getWhitePieces,
  pieceSymbols,
} from "./bbHelpers";
import {
  getKingMovesForSquare,
  getQueenMovesForSquare,
  getRookMovesForSquare,
} from "./majorPieceMoveGeneration";
import {
  getBishopMovesForSquare,
  getKnightMovesForSquare,
  getPawnMovesForSquare,
} from "./minorPieceMoveGeneration";

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
 * Gets the moves for a specific piece. Returns a bitboard of the moves for that piece.
 *
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {string} piece - the piece that is moving. "P", "N", "B", "R", "Q", or "K"
 * @param {number} from - the square to move from
 * @param {string} player - whose move it is ("w" or "b")
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {boolean} onlyCaptures - whether the moves should only be captures
 * @returns {bigint} a bitboard of the moves of the piece
 */
export const getPieceMoves = (
  bitboards,
  piece,
  from,
  player,
  enPassantSquare,
  castlingRights,
  onlyCaptures = false
) => {
  let moves = null;
  switch (piece.toUpperCase()) {
    case "P":
      moves = getPawnMovesForSquare(
        bitboards,
        player,
        from,
        enPassantSquare,
        onlyCaptures
      );
      break;
    case "N":
      moves = getKnightMovesForSquare(bitboards, player, from);
      break;
    case "B":
      moves = getBishopMovesForSquare(bitboards, player, from);
      break;
    case "R":
      moves = getRookMovesForSquare(bitboards, player, from);
      break;
    case "Q":
      moves = getQueenMovesForSquare(bitboards, player, from);
      break;
    case "K":
      moves = getKingMovesForSquare(bitboards, player, from, castlingRights);
      break;
    default:
      moves = BigInt(0); // No legal moves
  }

  return moves;
};

/**
 * Creates a bitboard for all of the moves a player has. Does not check for legality
 *
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {string} player - whose move it is ("w" or "b")
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {boolean} onlyCaptures - whether the moves should only be captures
 * @returns {bigint} a bitboard of all the moves a player has
 */
export const getAllPlayerMoves = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  onlyCaptures = false
) => {
  let allMoves = 0n;
  // Get player's overall pieces bitboard.
  const playerPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  let pieces = playerPieces;
  while (pieces !== 0n) {
    const square = bitScanForward(pieces);
    pieces &= pieces - 1n;

    const piece = getPieceAtSquare(square, bitboards);
    const formattedPiece = pieceSymbols[piece].toUpperCase();

    const pieceMoves = getPieceMoves(
      bitboards,
      formattedPiece,
      square,
      player,
      enPassantSquare,
      castlingRights,
      onlyCaptures
    );

    allMoves |= pieceMoves;
  }

  return allMoves;
};

/**
 * Gets all of the legal moves a player has as a bitboard.
 *
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {string} player - whose move it is ("w" or "b")
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {boolean} onlyCaptures - whether the moves should only be captures
 * @returns {bigint} a bitboard of all the legal moves a player has
 */
export const getAllLegalMoves = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  onlyCaptures = false
) => {
  let allMoves = 0n;
  // Get player's overall pieces bitboard.
  const playerPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  let pieces = playerPieces;
  while (pieces !== 0n) {
    const square = bitScanForward(pieces);
    pieces &= pieces - 1n;

    const piece = getPieceAtSquare(square, bitboards);
    const formattedPiece = pieceSymbols[piece].toUpperCase();

    const pieceMoves = getPieceMoves(
      bitboards,
      formattedPiece,
      square,
      player,
      enPassantSquare,
      castlingRights,
      onlyCaptures
    );

    const legalPieceMoves = filterIllegalMoves(
      bitboards,
      pieceMoves,
      square,
      player
    );

    allMoves |= legalPieceMoves;
  }

  return allMoves;
};

/**
 * Gets all of the legal moves for each square and returns it as an object.
 * The keys are the square of the piece and the fields is the bitboard for the square.
 * Ex: { 10: bigint, 34: bigint, etc.}
 *
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {string} player - whose move it is ("w" or "b")
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {boolean} onlyCaptures - whether the moves should only be captures
 * @returns {object} an object with corresponding bitboards for each square.
 */
export const getAllIndividualLegalMoves = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare
) => {
  let allMoves = {};
  // Get player's overall pieces bitboard.
  const playerPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  let pieces = playerPieces;
  while (pieces !== 0n) {
    const square = bitScanForward(pieces);
    pieces &= pieces - 1n;

    const piece = getPieceAtSquare(square, bitboards);
    const formattedPiece = generalSymbols[piece];

    const pieceMoves = getPieceMoves(
      bitboards,
      formattedPiece,
      square,
      player,
      enPassantSquare,
      castlingRights
    );

    const legalPieceMoves = filterIllegalMoves(
      bitboards,
      pieceMoves,
      square,
      player
    );
    if (legalPieceMoves !== 0n) {
      allMoves[square] = legalPieceMoves;
    }
  }

  return allMoves;
};
