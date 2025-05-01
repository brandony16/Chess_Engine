import { bitScanForward } from "./bbUtils";
import {
  getCachedAttackMask,
  updateAttackMaskHash,
} from "./PieceMasks/attackMask";
import { makeMove } from "./moveMaking/makeMoveLogic";
import {
  getBlackPieces,
  getPieceAtSquare,
  getWhitePieces,
} from "./pieceGetters";
import { getPieceMoves } from "./moveGeneration/allMoveGeneration";

/**
 * Determines whether a given square is attacked by the opponent
 *
 * @param {BigUint64Array} bitboards - bitboards of the current position
 * @param {number} square - square to check if it is attacked
 * @param {string} opponent - the other player ("w" or "b")
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
 * @param {string} player - player whose turn it is ("w" or "b")
 * @returns {boolean} whether the player is in check
 */
export const isInCheck = (bitboards, player) => {
  let kingBB = bitboards[5]; // White King
  let opponent = "b";
  if (player === "b") {
    kingBB = bitboards[11]; // Black king
    opponent = "w";
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
 * @param {string} player - player whose turn it is ("w" or "b")
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
  const isPlayerWhite = player === "w";
  const opponent = isPlayerWhite ? "b" : "w";
  const one = 1n;

  // Iterate only over moves that are set (i.e. bits that are 1)
  let remainingMoves = moves;
  while (remainingMoves !== 0n) {
    const to = bitScanForward(remainingMoves);
    remainingMoves &= remainingMoves - one;

    // Simulate the move and check if the king is attacked
    const moveObj = makeMove(bitboards, from, to, null);
    const tempBitboards = moveObj.bitboards;
    const kingBB = tempBitboards[isPlayerWhite ? 5 : 11];
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
    if (
      !isSquareAttacked(
        tempBitboards,
        kingSquare,
        opponent,
        newHash
      )
    ) {
      filteredMoves |= 1n << BigInt(to);
    }
  }

  return filteredMoves;
};

/**
 * Determines if a given player has a legal move.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {string} player - who to check if they have a move ("w" or "b")
 * @param {number} enPassantSquare - the square where en passant is legal. Null if none
 * @returns {boolean} if the player has a legal move.
 */
export const hasLegalMove = (bitboards, player, enPassantSquare) => {
  const playerPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  let pieces = playerPieces;
  while (pieces !== 0n) {
    const sq = bitScanForward(pieces);
    pieces &= pieces - 1n;

    const piece = getPieceAtSquare(sq, bitboards);
    // Dont care about color, so if piece is bigger than 5, subtract 6 as that is how
    // many distinct pieces each side has
    const formattedPiece = piece > 5 ? piece - 6 : piece;
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
