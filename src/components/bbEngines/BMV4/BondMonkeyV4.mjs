import { computeHash } from "../../../Core Logic/zobristHashing.mjs";
import {
  clearQTT,
  clearTT,
} from "../../../Core Logic/transpositionTable.mjs";
import { CHECKMATE_VALUE } from "../../../Core Logic/constants.mjs";
import { minimax4 } from "./minimax4.mjs";
import { computeAllAttackMasks } from "../../../Core Logic/PieceMasks/individualAttackMasks.mjs";

// Root id for transposition table. Helps avoid stale entries
export let rootId = 0;

/**
 * Gets the best move in a position. Adds a quiescence search to prevent the horizon effect
 * where the engine will miscalculate capture sequences.
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
  clearQTT();

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
      break;
    }

    rootId++;
  }

  return { ...bestMove, bestEval };
}
