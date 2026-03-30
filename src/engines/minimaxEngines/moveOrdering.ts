import { moreThanOne } from "../../game/bb.ts";
import type { Move } from "../../game/moveMaking/move.ts";
import { MAX_MOVES, type Position } from "../../game/Position.ts";
import { ABORT_SCORE, type Engine } from "../Engine.ts";
import {
  DEFAULT_EVAL_WEIGHTS,
  MATE_SCORE,
  type EvalWeights,
} from "../evaluation/Evaluation.ts";
import { evaluateMaterial } from "../evaluation/materialEvaluation.ts";
import { scoreMoveForOrdering } from "../mvv_lva.ts";
import type { SearchContext } from "../searchContext.ts";

/**
 * Evolution of minimaxV2 that implements move ordering
 */
export class MinimaxV3 implements Engine {
  readonly name: string;

  private readonly weights: EvalWeights;
  depth: number;

  constructor(depth: number) {
    this.name = "MinimaxV3";
    this.weights = DEFAULT_EVAL_WEIGHTS;
    this.depth = depth;
  }

  search(pos: Position, ctx: SearchContext): Move {
    pos.searchPly = 0;

    let bestMove = 0;

    for (let depth = 1; depth <= this.depth; depth++) {
      const result = this.#searchRoot(pos, depth, ctx);

      if (ctx.aborted) {
        break;
      }

      bestMove = result;
    }

    return bestMove;
  }

  #searchRoot(pos: Position, depth: number, ctx: SearchContext): Move {
    const start = pos.searchPly * MAX_MOVES;
    const moveNum = pos.generatePseudoLegalMoves();
    const checkers = pos.getCheckers();
    const pinned = pos.getPinnedPieces();
    const doubleCheck = moreThanOne(checkers[0], checkers[1]);

    let bestMove = 0;
    let bestScore = -Infinity;

    const scores = new Int32Array(moveNum);
    for (let i = 0; i < moveNum; i++) {
      scores[i] = scoreMoveForOrdering(pos.moveBuffer[start + i], pos);
    }

    for (let i = 0; i < moveNum; i++) {
      this.#pickBestMove(pos.moveBuffer, scores, start, i, moveNum);

      const move = pos.moveBuffer[start + i];

      if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;

      pos.makeMove(move);

      const score = -this.#negamax(pos, depth - 1, -Infinity, -bestScore, ctx);

      pos.unmakeMove();

      if (ctx.aborted) return bestMove;

      if (score > bestScore) {
        bestMove = move;
        bestScore = score;
      }
    }

    return bestMove;
  }

  #negamax(
    pos: Position,
    depth: number,
    alpha: number,
    beta: number,
    ctx: SearchContext,
  ): number {
    if (ctx.tick()) return ABORT_SCORE;

    if (depth === 0) {
      return evaluateMaterial(pos, this.weights);
    }

    const start = pos.searchPly * MAX_MOVES;
    const moves = pos.generatePseudoLegalMoves();
    const checkers = pos.getCheckers();
    const pinned = pos.getPinnedPieces();
    const doubleCheck = moreThanOne(checkers[0], checkers[1]);

    // Make this a buffer
    const scores = new Int32Array(moves);
    for (let i = 0; i < moves; i++) {
      scores[i] = scoreMoveForOrdering(pos.moveBuffer[start + i], pos);
    }

    let legalCount = 0;
    for (let i = 0; i < moves; i++) {
      // Move best (highest scoring) move to the front of moveBuffer
      this.#pickBestMove(pos.moveBuffer, scores, start, i, moves);

      const move = pos.moveBuffer[start + i];

      if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;
      legalCount++;

      pos.makeMove(move);

      const score = -this.#negamax(pos, depth - 1, -beta, -alpha, ctx);

      pos.unmakeMove();

      if (ctx.aborted) return ABORT_SCORE;

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

  // Do 1 step of selection sort to search for the move to search
  #pickBestMove(
    moveBuffer: Uint32Array,
    scores: Int32Array,
    start: number,
    current: number,
    end: number,
  ) {
    let bestIdx = current;
    let bestScore = scores[current];

    for (let i = current + 1; i < end; i++) {
      if (scores[i] > bestScore) {
        bestScore = scores[i];
        bestIdx = i;
      }
    }

    if (bestIdx !== current) {
      // Swap moves
      const tmpMove = moveBuffer[start + current];
      moveBuffer[start + current] = moveBuffer[start + bestIdx];
      moveBuffer[start + bestIdx] = tmpMove;
      // Swap scores
      const tmpScore = scores[current];
      scores[current] = scores[bestIdx];
      scores[bestIdx] = tmpScore;
    }
  }
}
