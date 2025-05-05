import { bitScanForward } from "../../bbUtils";
import {
  BLACK_BISHOP,
  BLACK_KNIGHT,
  WHITE,
  WHITE_BISHOP,
  WHITE_KNIGHT,
} from "../../constants";
import Move from "../../moveMaking/move";
import {
  getBlackPieces,
  getPieceAtSquare,
  getWhitePieces,
} from "../../pieceGetters";
import { knightMasks } from "../../PieceMasks/knightMask";
import { getBishopAttacksForSquare } from "../slidingPieceAttacks";

/**
 * Gets the move bitboard for a knight.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {number} from - the square its moving from
 * @returns {bigint} the move bitboard for the knight
 */
export const knightQuiescence = (bitboards, player) => {
  const moves = [];

  const isWhite = player === WHITE;
  const piece = isWhite ? WHITE_KNIGHT : BLACK_KNIGHT;
  const opponentPieces = isWhite
    ? getBlackPieces(bitboards)
    : getWhitePieces(bitboards);
  let knightBB = isWhite ? bitboards[WHITE_KNIGHT] : bitboards[BLACK_KNIGHT];

  while (knightBB) {
    const from = bitScanForward(knightBB);
    knightBB &= knightBB - 1n;

    // Get raw knight captures
    let kMoves = knightMasks[from] & opponentPieces;
    while (moves) {
      const to = bitScanForward(kMoves);
      kMoves &= kMoves - 1n;

      const captured = getPieceAtSquare(to, bitboards);
      const move = new Move(from, to, piece, captured, null, false, false);

      moves.push(move);
    }
  }

  return moves;
};

/**
 * Gets the move bitboard for a bishop.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {number} from - the square its moving from
 * @returns {bigint} the move bitboard for the bishop
 */
export const bishopQuiescence = (bitboards, player) => {
  const moves = [];

  const isWhite = player === WHITE;
  const opponentPieces = isWhite
    ? getBlackPieces(bitboards)
    : getWhitePieces(bitboards);
  const piece = isWhite ? WHITE_BISHOP : BLACK_BISHOP;

  let bishopBB = isWhite ? bitboards[WHITE_BISHOP] : bitboards[BLACK_BISHOP];
  while (bishopBB) {
    const from = bitScanForward(bishopBB);
    bishopBB &= bishopBB - 1n;

    let moveBB = getBishopAttacksForSquare(bitboards, from) & opponentPieces;
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
