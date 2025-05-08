import { getCachedAttackMask } from "../../bitboardUtils/PieceMasks/attackMask";
import { computeHash } from "../../bitboardUtils/zobristHashing";
import { clearTT } from "../../bitboardUtils/TranspositionTable/transpositionTable";
import { BLACK, CHECKMATE_VALUE, WHITE } from "../../bitboardUtils/constants";
import { minimax2 } from "./minimax2";

/**
 * @typedef {object} CastlingRights
 * @property {boolean} whiteKingside - Whether castling kingside is legal for white
 * @property {boolean} whiteQueenside - Whether castling queenside is legal for white
 * @property {boolean} blackKingside - Whether castling kingside is legal for black
 * @property {boolean} blackQueenside - Whether castling queenside is legal for black
 */

// Root id for transposition table. Helps avoid stale entries
export let rootId = 0;

/**
 * Gets the best move in a position based purely off of material.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {Map} prevPositions - a map of the previous positions
 * @param {number} depth - the depth to search in ply. 1 ply is one player moving. 2 ply is one move, where each side gets to play.
 * @param {number} timeLimit - the max time the engine can search in milliseconds.
 * @returns {{ from: number, to: number, promotion: string}, number} the best move found and the evaluation
 */
export function BMV2(
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  prevPositions,
  maxDepth,
  timeLimit = Infinity
) {
  clearTT(); // Clears transposition table

  const start = performance.now();
  const opponent = player === WHITE ? BLACK : WHITE;

  let bestMove = null;
  let bestEval = null;

  const rootHash = computeHash(
    bitboards,
    player,
    enPassantSquare,
    castlingRights
  );
  const rootAttackHash = computeHash(bitboards, opponent);

  // Ensures the attack mask cache has the attack mask at the rootAttackHash
  getCachedAttackMask(bitboards, opponent, rootAttackHash);

  rootId = 0;
  for (let depth = 1; depth <= maxDepth; depth++) {
    const { score, move } = minimax2(
      bitboards,
      player,
      castlingRights,
      enPassantSquare,
      prevPositions,
      rootHash,
      rootAttackHash,
      0,
      depth,
      -Infinity,
      Infinity
    );

    if (move != null) {
      bestMove = move;
    }
    bestEval = score;

    if (Math.abs(score) > CHECKMATE_VALUE - depth && move) {
      console.log("mate break");
      break;
    }

    if (performance.now() - start > timeLimit) {
      console.log("time limit");
      break;
    }

    rootId++;
  }
  return { ...bestMove, bestEval };
}
