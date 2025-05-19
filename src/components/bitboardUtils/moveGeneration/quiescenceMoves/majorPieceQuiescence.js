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
import { getMovesFromBB } from "../../moveMaking/makeMoveLogic";
import {
  getKingMovesForSquare,
  getQueenMovesForSquare,
  getRookMovesForSquare,
} from "../majorPieceMoveGeneration";
/**
 * Gets the quiescence moves for a rook.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {bigint} opponentPieces - a bitboard of the opponents positions
 * @param {bigint} oppAttackHash - the hash of the opponents attack map
 * @returns {bigint} the move bitboard for the bishop
 */
export const rookQuiescence = (
  bitboards,
  player,
  opponentPieces,
  pinnedMask,
  getRayMask
) => {
  const moves = [];

  const isWhite = player === WHITE;

  const piece = isWhite ? WHITE_ROOK : BLACK_ROOK;

  let rookBB = bitboards[piece];
  while (rookBB) {
    const from = bitScanForward(rookBB);
    rookBB &= rookBB - 1n;

    let moveBB =
      getRookMovesForSquare(bitboards, player, from, pinnedMask, getRayMask) &
      opponentPieces;

    const rookMoves = getMovesFromBB(
      bitboards,
      moveBB,
      from,
      piece,
      null,
      player
    );
    moves.concat(rookMoves);
  }

  return moves;
};

/**
 * Gets the quiescence moves for a queen.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {bigint} opponentPieces - a bitboard of the opponents positions
 * @param {bigint} oppAttackHash - the hash of the opponents attack map
 * @returns {bigint} the move bitboard for the bishop
 */
export const queenQuiescence = (
  bitboards,
  player,
  opponentPieces,
  pinnedMask,
  getRayMask
) => {
  const moves = [];

  const isWhite = player === WHITE;

  const piece = isWhite ? WHITE_QUEEN : BLACK_QUEEN;

  let queenBB = bitboards[piece];
  while (queenBB) {
    const from = bitScanForward(queenBB);
    queenBB &= queenBB - 1n;

    let moveBB =
      getQueenMovesForSquare(bitboards, player, from, pinnedMask, getRayMask) &
      opponentPieces;

    const queenMoves = getMovesFromBB(
      bitboards,
      moveBB,
      from,
      piece,
      null,
      player
    );
    moves.concat(queenMoves);
  }

  return moves;
};

/**
 * Gets the quiescence moves for a king.
 * @param {BigUint64Array} bitboards - the bitboards in the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {bigint} opponentPieces - a bitboard of the opponents positions
 * @param {bigint} oppAttackMask - the opponents attack mask
 * @returns {bigint} the move bitboard for the bishop
 */
export const kingQuiescence = (
  bitboards,
  player,
  opponentPieces,
  oppAttackMask
) => {
  const moves = [];

  const piece = player === WHITE ? WHITE_KING : BLACK_KING;

  let kingBB = bitboards[piece];
  const from = bitScanForward(kingBB);

  // Get raw king captures
  let moveBB =
    getKingMovesForSquare(bitboards, player, from, oppAttackMask) &
    opponentPieces;

  const kingMoves = getMovesFromBB(
    bitboards,
    moveBB,
    from,
    piece,
    null,
    player
  );

  moves.concat(kingMoves);

  return moves;
};
