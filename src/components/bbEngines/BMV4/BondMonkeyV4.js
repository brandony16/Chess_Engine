import { computeHash } from "../../bitboardUtils/zobristHashing";
import { clearTT } from "../../bitboardUtils/TranspositionTable/transpositionTable";
import { CHECKMATE_VALUE } from "../../bitboardUtils/constants";
import { minimax4 } from "./minimax4";
import { computeAllAttackMasks } from "../../bitboardUtils/PieceMasks/individualAttackMasks";
import { initializePieceAtArray } from "../../bitboardUtils/pieceGetters";

// Root id for transposition table. Helps avoid stale entries
export let rootId = 0;

/**
 * Gets the best move in a position.
 * Adds a better evaluation function using piece sqaure tables (PSQT).
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {number} player - the player whose move it is (0 for w, 1 for b)
 * @param {Array<boolean} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where en passant is legal
 * @param {Map} prevPositions - a map of the previous positions
 * @param {number} depth - the depth to search in ply. 1 ply is one player moving. 2 ply is one move, where each side gets to play.
 * @param {number} timeLimit - the max time the engine can search in milliseconds.
 * @returns {{ from: number, to: number, promotion: string}, number} the best move found and the evaluation
 */
export function BMV4(
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  prevPositions,
  maxDepth,
  timeLimit = Infinity
) {
  clearTT(); // Clears transposition table
  initializePieceAtArray(bitboards);
  
  const start = performance.now();

  let bestMove = null;
  let bestEval = null;

  const epFile = enPassantSquare ? enPassantSquare % 8 : -1;
  const rootHash = computeHash(bitboards, player, epFile, castlingRights);

  rootId = 0;
  for (let depth = 1; depth <= maxDepth; depth++) {
    computeAllAttackMasks(bitboards);

    const { score, move } = minimax4(
      bitboards,
      player,
      castlingRights,
      enPassantSquare,
      prevPositions,
      rootHash,
      0,
      depth,
      -Infinity,
      Infinity
    );

    if (move !== null) {
      bestEval = score;
      bestMove = move;
    }

    if (Math.abs(score) > CHECKMATE_VALUE - depth && move) {
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
