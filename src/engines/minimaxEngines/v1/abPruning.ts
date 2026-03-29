import { moreThanOne } from "../../../game/bb.ts";
import type { Move } from "../../../game/moveMaking/move.ts";
import { MAX_MOVES, type Position } from "../../../game/Position.ts";
import type { Engine } from "../../Engine.ts";
import {
  DEFAULT_EVAL_WEIGHTS,
  MATE_SCORE,
  type EvalWeights,
} from "../../evaluation/Evaluation.ts";
import { evaluateMaterial } from "../../evaluation/materialEvaluation.ts";
import type { SearchContext } from "../../searchContext.ts";

/**
 * Evolution of minimaxV1 that implements alpha-beta pruning
 */
export class MinimaxV2 implements Engine {
  readonly name: string;
  nodesSearched: number;
  
  private readonly weights: EvalWeights;
  depth: number;

  constructor(depth: number) {
    this.name = "MinimaxV2";
    this.nodesSearched = 0;
    this.weights = DEFAULT_EVAL_WEIGHTS;
    this.depth = depth;
  }

  search(pos: Position, ctx: SearchContext): Move {
    pos.searchPly = 0;
    this.nodesSearched = 0; // reset node count

    const moveNum = pos.generatePseudoLegalMoves();
    const checkers = pos.getCheckers();
    const pinned = pos.getPinnedPieces();
    const doubleCheck = moreThanOne(checkers[0], checkers[1]);

    let bestMove = pos.moveBuffer[0];
    let bestScore = -Infinity;

    for (let i = 0; i < moveNum; i++) {
      const move = pos.moveBuffer[i];

      if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;

      pos.makeMove(move);

      const score = -this.#negamax(pos, this.depth - 1, -Infinity, -bestScore);

      pos.unmakeMove();

      if (score > bestScore) {
        bestMove = move;
        bestScore = score;
      }
    }

    return bestMove;
  }

  #negamax(pos: Position, depth: number, alpha: number, beta: number) {
    this.nodesSearched++;

    if (depth === 0) {
      return evaluateMaterial(pos, this.weights);
    }

    const start = pos.searchPly * MAX_MOVES;
    const moves = pos.generatePseudoLegalMoves();
    const checkers = pos.getCheckers();
    const pinned = pos.getPinnedPieces();
    const doubleCheck = moreThanOne(checkers[0], checkers[1]);

    let legalCount = 0;
    for (let i = 0; i < moves; i++) {
      const move = pos.moveBuffer[start + i];

      if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;
      legalCount++;

      pos.makeMove(move);

      const score = -this.#negamax(pos, depth - 1, -beta, -alpha);

      pos.unmakeMove();

      if (score >= beta) {
        // Beta cutoff: opponent won't allow this position because we already
        // have a move that's too good. Stop searching immediately.
        return beta;
      }

      if (score > alpha) {
        // Found a better move than our current best - raise the lower bound.
        alpha = score;
      }
    }

    if (legalCount === 0) {
      if (pos.isInCheck(pos.sideToMove)) {
        // Return mate score relative to distance from root. Prefer
        // closer mates by making deeper mates score slightly less.
        return -MATE_SCORE + pos.searchPly;
      }
      return 0; // stalemate
    }

    return alpha;
  }
}
