import { filterIllegalMoves } from "../bbChessLogic";
import { bitScanForward } from "../bbUtils";
import { getPieceAtSquare, getPlayerBoard } from "../pieceGetters";
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
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
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
 * Gets all of the legal moves a player has as a bitboard.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {bigint} opponentHash - A hash for the opponents attack map
 * @returns {Array<Move>} a bitboard of all the legal moves a player has
 */
export const getAllLegalMoves = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  opponentHash = null
) => {
  let allMoves = [];
  // Get player's overall pieces bitboard.
  const playerPieces = getPlayerBoard(player, bitboards);

  let pieces = playerPieces;
  while (pieces !== 0n) {
    const square = bitScanForward(pieces);
    pieces &= pieces - 1n;

    const piece = getPieceAtSquare(square, bitboards);
    const formattedPiece = piece % 6;

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
      enPassantSquare,
      opponentHash
    );

    allMoves = allMoves.concat(legalPieceMoves);
  }

  return allMoves;
};
