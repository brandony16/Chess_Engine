import { bitScanForward } from "./bbUtils";
import {
  getCachedAttackMask,
  updateAttackMaskHash,
} from "./PieceMasks/attackMask";
import { makeMove } from "./moveMaking/makeMoveLogic";
import { getPieceAtSquare, getPlayerBoard } from "./pieceGetters";
import { getPieceMoves } from "./moveGeneration/allMoveGeneration";
import { BLACK, BLACK_KING, WHITE, WHITE_KING } from "./constants";

/**
 * Determines whether a given square is attacked by the opponent
 *
 * @param {BigUint64Array} bitboards - bitboards of the current position
 * @param {number} square - square to check if it is attacked
 * @param {number} opponent - the other player (0 for w, 1 for b)
 * @param {bigint} attackHash - the hash of the attack map for the opponent
 * @returns {boolean} if the square is attacked
 */
export const isSquareAttacked = (bitboards, square, opponent, attackHash) => {
  const opponentAttackMask = getCachedAttackMask(
    bitboards,
    opponent,
    attackHash
  );

  return (opponentAttackMask & (1n << BigInt(square))) !== 0n;
};

/**
 * Determines whether a given player is in check.
 *
 * @param {BigUint64Array} bitboards - bitboards of the current position
 * @param {number} player - whose move it is (0 for w, 1 for b)
 * @returns {boolean} whether the player is in check
 */
export const isInCheck = (bitboards, player) => {
  let kingBB = bitboards[WHITE_KING];
  let opponent = BLACK;
  if (player === BLACK) {
    kingBB = bitboards[BLACK_KING];
    opponent = WHITE;
  }

  const kingSquare = bitScanForward(kingBB);

  return isSquareAttacked(bitboards, kingSquare, opponent);
};

/**
 * Filters out illegal moves from a bitboard of moves for a piece.
 * Mainly filters out moves that put your own king in check.
 *
 * @param {BigUint64Array} bitboards - bitboards of the current position
 * @param {bigint} moves - bitboard of moves for a piece
 * @param {number} from - square the piece is moving from
 * @param {number} player - whose move it is (0 for w, 1 for b)
 * @param {bigint} opponentHash - an attack hash for the position
 * @returns {bigint} the filtered moves
 */
export const filterIllegalMoves = (
  bitboards,
  moves,
  from,
  player,
  opponentHash = null
) => {
  let filteredMoves = 0n;
  const isPlayerWhite = player === WHITE;
  const opponent = isPlayerWhite ? BLACK : WHITE;
  const one = 1n;

  // Iterate only over moves that are set (i.e. bits that are 1)
  let remainingMoves = moves;
  while (remainingMoves !== 0n) {
    const to = bitScanForward(remainingMoves);
    remainingMoves &= remainingMoves - one;

    // Simulate the move and check if the king is attacked
    const moveObj = makeMove(bitboards, from, to, null);
    const tempBitboards = moveObj.bitboards;
    const kingBB = tempBitboards[isPlayerWhite ? WHITE_KING : BLACK_KING];
    const kingSquare = bitScanForward(kingBB);
    let newHash = null;
    if (opponentHash) {
      newHash = updateAttackMaskHash(
        bitboards,
        tempBitboards,
        from,
        to,
        opponentHash,
        opponent,
        moveObj.enPassantSquare,
        true
      );
    }

    if (!isSquareAttacked(tempBitboards, kingSquare, opponent, newHash)) {
      filteredMoves |= 1n << BigInt(to);
    }
  }

  return filteredMoves;
};

/**
 * Determines if a given player has a legal move.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {number} player - whose move it is (0 for w, 1 for b)
 * @param {number} enPassantSquare - the square where en passant is legal. Null if none
 * @returns {boolean} if the player has a legal move.
 */
export const hasLegalMove = (bitboards, player, enPassantSquare) => {
  const playerPieces = getPlayerBoard(player, bitboards);

  let pieces = playerPieces;
  while (pieces !== 0n) {
    const sq = bitScanForward(pieces);
    pieces &= pieces - 1n;

    const piece = getPieceAtSquare(sq, bitboards);
    // Dont care about color, so if piece is bigger than 5, subtract 6 as that is how
    // many distinct pieces each side has
    const formattedPiece = piece - 6 * player;
    const moves = getPieceMoves(
      bitboards,
      formattedPiece,
      sq,
      player,
      enPassantSquare,
      null // Never a case where castling is the only king move
    );

    const filtered = filterIllegalMoves(bitboards, moves, sq, player);
    if (filtered !== 0n) return true;
  }
  return false;
};
