import { filterIllegalMoves } from "../../bbChessLogic";
import { bitScanForward } from "../../bbUtils";
import {
  BLACK_BISHOP,
  BLACK_KNIGHT,
  WHITE,
  WHITE_BISHOP,
  WHITE_KNIGHT,
} from "../../constants";
import { knightMasks } from "../../PieceMasks/knightMask";
import { getBishopAttacksForSquare } from "../slidingPieceAttacks";

/**
 * Gets the quiescence moves for a knight.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {bigint} opponentPieces - a bitboard of the opponents positions
 * @param {bigint} oppAttackHash - the hash of the opponents attack map
 * @returns {Array<Move>} the move bitboard for the knight
 */
export const knightQuiescence = (
  bitboards,
  player,
  opponentPieces,
  oppAttackHash
) => {
  const moves = [];

  const isWhite = player === WHITE;
  const piece = isWhite ? WHITE_KNIGHT : BLACK_KNIGHT;
  let knightBB = bitboards[piece];

  while (knightBB) {
    const from = bitScanForward(knightBB);
    knightBB &= knightBB - 1n;

    // Get raw knight captures
    let moveBB = knightMasks[from] & opponentPieces;
    const knightMoves = filterIllegalMoves(
      bitboards,
      moveBB,
      from,
      player,
      null, // En passant square
      oppAttackHash
    );

    moves.concat(knightMoves);
  }

  return moves;
};

/**
 * Gets the quiescence moves for a bishop.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {bigint} opponentPieces - a bitboard of the opponents positions
 * @param {bigint} oppAttackHash - the hash of the opponents attack map
 * @returns {Array<Move>} the move bitboard for the bishop
 */
export const bishopQuiescence = (
  bitboards,
  player,
  opponentPieces,
  oppAttackHash
) => {
  const moves = [];

  const isWhite = player === WHITE;

  const piece = isWhite ? WHITE_BISHOP : BLACK_BISHOP;

  let bishopBB = bitboards[piece];
  while (bishopBB) {
    const from = bitScanForward(bishopBB);
    bishopBB &= bishopBB - 1n;

    let moveBB = getBishopAttacksForSquare(bitboards, from) & opponentPieces;
    const bishopMoves = filterIllegalMoves(
      bitboards,
      moveBB,
      from,
      player,
      null, // En passant square
      oppAttackHash
    );

    moves.concat(bishopMoves);
  }

  return moves;
};
