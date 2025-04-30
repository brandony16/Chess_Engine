import { filterIllegalMoves } from "../bbChessLogic";
import { bitScanForward } from "../bbUtils";
import {
  getBlackPieces,
  getPieceAtSquare,
  getWhitePieces,
} from "../pieceGetters";
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
 * @typedef {object} CastlingRights
 * @property {boolean} whiteKingside - Whether castling kingside is legal for white
 * @property {boolean} whiteQueenside - Whether castling queenside is legal for white
 * @property {boolean} blackKingside - Whether castling kingside is legal for black
 * @property {boolean} blackQueenside - Whether castling queenside is legal for black
 */

/**
 * Gets the moves for a specific piece. Returns a bitboard of the moves for that piece.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {int} piece - the piece that is moving. 0:pawn, 1:knight, 2:bishop, 3:rook, 4:queen, 5:king
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
  switch (piece) {
    case 0:
      moves = getPawnMovesForSquare(
        bitboards,
        player,
        from,
        enPassantSquare,
        onlyCaptures
      );
      break;
    case 1:
      moves = getKnightMovesForSquare(bitboards, player, from);
      break;
    case 2:
      moves = getBishopMovesForSquare(bitboards, player, from);
      break;
    case 3:
      moves = getRookMovesForSquare(bitboards, player, from);
      break;
    case 4:
      moves = getQueenMovesForSquare(bitboards, player, from);
      break;
    case 5:
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
 * @param {BigUint64Array} bitboards - the bitboards of the current position
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
    // Dont care about color, so if piece is bigger than 5, subtract 6 as that is how
    // many distinct pieces each side has
    const formattedPiece = piece > 5 ? piece - 6 : piece;

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
 * @param {BigUint64Array} bitboards - the bitboards of the current position
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
    // Dont care about color, so if piece is bigger than 5, subtract 6 as that is how
    // many distinct pieces each side has
    const formattedPiece = piece > 5 ? piece - 6 : piece;

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
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {string} player - whose move it is ("w" or "b")
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {bigint} opponentHash - Hash that leads to the attack map of the opponent
 * @returns {object} an object with corresponding bitboards for each square.
 */
export const getAllIndividualLegalMoves = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  opponentHash
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
    // Dont care about color, so if piece is bigger than 5, subtract 6 as that is how
    // many distinct pieces each side has
    const formattedPiece = piece > 5 ? piece - 6 : piece;

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
      player,
      opponentHash
    );

    if (legalPieceMoves !== 0n) {
      allMoves[square] = legalPieceMoves;
    }
  }

  return allMoves;
};
