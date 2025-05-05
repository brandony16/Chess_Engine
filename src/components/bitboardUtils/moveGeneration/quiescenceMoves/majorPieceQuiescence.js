import { filterIllegalMoves } from "../../bbChessLogic";
import { bitScanForward } from "../../bbUtils";
import {
  BLACK_KING,
  BLACK_QUEEN,
  BLACK_ROOK,
  WHITE,
  WHITE_KING,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../../constants";
import Move from "../../moveMaking/move";
import { getPieceAtSquare } from "../../pieceGetters";
import { knightMasks } from "../../PieceMasks/knightMask";
import {
  getQueenAttacksForSquare,
  getRookAttacksForSquare,
} from "../slidingPieceAttacks";

/**
 * Gets the quiescence moves for a rook.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {bigint} opponentPieces - a bitboard of the opponents positions
 * @returns {bigint} the move bitboard for the bishop
 */
export const rookQuiescence = (bitboards, player, opponentPieces) => {
  const moves = [];

  const isWhite = player === WHITE;

  const piece = isWhite ? WHITE_ROOK : BLACK_ROOK;

  let rookBB = bitboards[piece];
  while (rookBB) {
    const from = bitScanForward(rookBB);
    rookBB &= rookBB - 1n;

    let moveBB = getRookAttacksForSquare(bitboards, from) & opponentPieces;
    moveBB = filterIllegalMoves(bitboards, moveBB, from, player, null);
    while (moveBB) {
      const to = bitScanForward(moveBB);
      moveBB &= moveBB - 1n;

      const captured = getPieceAtSquare(to, bitboards);
      const move = new Move(from, to, piece, captured, null, false, false);

      moves.push(move);
    }
  }

  return moves;
};

/**
 * Gets the quiescence moves for a queen.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {bigint} opponentPieces - a bitboard of the opponents positions
 * @returns {bigint} the move bitboard for the bishop
 */
export const queenQuiescence = (bitboards, player, opponentPieces) => {
  const moves = [];

  const isWhite = player === WHITE;

  const piece = isWhite ? WHITE_QUEEN : BLACK_QUEEN;

  let queenBB = bitboards[piece];
  while (queenBB) {
    const from = bitScanForward(queenBB);
    queenBB &= queenBB - 1n;

    let moveBB = getQueenAttacksForSquare(bitboards, from) & opponentPieces;
    moveBB = filterIllegalMoves(bitboards, moveBB, from, player, null);
    while (moveBB) {
      const to = bitScanForward(moveBB);
      moveBB &= moveBB - 1n;

      const captured = getPieceAtSquare(to, bitboards);
      const move = new Move(from, to, piece, captured, null, false, false);

      moves.push(move);
    }
  }

  return moves;
};

/**
 * Gets the quiescence moves for a king.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {bigint} opponentPieces - a bitboard of the opponents positions
 * @returns {bigint} the move bitboard for the bishop
 */
export const kingQuiescence = (bitboards, player, opponentPieces) => {
  const moves = [];

  const isWhite = player === WHITE;
  const piece = isWhite ? WHITE_KING : BLACK_KING;

  let kingBB = bitboards[piece];
  const from = bitScanForward(kingBB);

  // Get raw king captures
  let kMoves = knightMasks[from] & opponentPieces;
  kMoves = filterIllegalMoves(bitboards, kMoves, from, player, null);
  while (moves) {
    const to = bitScanForward(kMoves);
    kMoves &= kMoves - 1n;

    const captured = getPieceAtSquare(to, bitboards);
    const move = new Move(from, to, piece, captured, null, false, false);

    moves.push(move);
  }

  return moves;
};
