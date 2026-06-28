import { moreThanOne } from "../../game/bb.ts";
import type { Move } from "../../game/moveMaking/move.ts";
import { MAX_MOVES, type Position } from "../../game/Position.ts";
import { ABORT_SCORE, INFINITY, type Engine } from "../Engine.ts";
import {
  DEFAULT_EVAL_WEIGHTS,
  MATE_SCORE,
  type Evaluation,
  type EvalWeights,
} from "../evaluation/Evaluation.ts";
import { evaluateV1 } from "../evaluation/evaluationV1.ts";
import type { SearchContext } from "../searchContext.ts";

/**
 * Evolution of minimaxV1 that implements alpha-beta pruning
 */
export class MinimaxV2 implements Engine {
  private readonly weights: EvalWeights;
  private evaluate: Evaluation;

  depth: number;
  depthReached: number;

  constructor(depth: number) {
    this.weights = DEFAULT_EVAL_WEIGHTS;
    this.depth = depth;
    this.depthReached = 0;
    this.evaluate = evaluateV1;
  }

  newGame(): void {}

  search(
    pos: Position,
    evaluate: Evaluation,
    ctx: SearchContext,
    log: boolean = false,
  ): Move {
    ctx.startSearch(pos.ply);

    pos.searchPly = 0;
    this.evaluate = evaluate;

    let bestMove = 0;

    this.depthReached = 0;
    for (let depth = 1; depth <= this.depth; depth++) {
      this.depthReached++;
      const result = this.#searchRoot(pos, depth, ctx);

      if (ctx.aborted) {
        break;
      }
      if (ctx.shouldStopDeepening()) {
        break;
      }

      if (depth > 1 && result !== bestMove) {
        ctx.extendTime();
      }
      bestMove = result;
    }
    if (log) {
      console.log(
        `Depth Searched: ${this.depthReached}\nNodes searched: ${ctx.nodesSearched}\n`,
      );
    }

    ctx.endSearch();

    return bestMove;
  }

  #searchRoot(pos: Position, depth: number, ctx: SearchContext): Move {
    if (ctx.tick()) {
      return ABORT_SCORE;
    }

    const start = pos.searchPly * MAX_MOVES;
    const moveNum = pos.generatePseudoLegalMoves();
    const checkers = pos.getCheckers();
    const pinned = pos.getPinnedPieces();
    const doubleCheck = moreThanOne(checkers[0], checkers[1]);

    let bestMove = 0;
    let bestScore = -INFINITY;

    const moveBuf = pos.moveBuffer;
    for (let i = 0; i < moveNum; i++) {
      const move = moveBuf[start + i];

      if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;

      pos.makeMove(move);

      const score = -this.#negamax(pos, depth - 1, -INFINITY, -bestScore, ctx);

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
      return this.evaluate(pos, this.weights);
    }

    const start = pos.searchPly * MAX_MOVES;
    const moves = pos.generatePseudoLegalMoves();
    const checkers = pos.getCheckers();
    const pinned = pos.getPinnedPieces();
    const doubleCheck = moreThanOne(checkers[0], checkers[1]);

    const moveBuf = pos.moveBuffer;

    let legalCount = 0;
    let bestMove = 0;
    let bestScore = -INFINITY;
    for (let i = 0; i < moves; i++) {
      const move = moveBuf[start + i];

      if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;
      legalCount++;

      pos.makeMove(move);

      const score = -this.#negamax(pos, depth - 1, -beta, -alpha, ctx);

      pos.unmakeMove();

      if (ctx.aborted) return ABORT_SCORE;

      // found a better move than out previous best - raise the lower bound
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;

        if (score > alpha) {
          alpha = score;
        }
      }

      if (score >= beta) {
        // Beta cutoff: opponent won't allow this position because we already
        // have a move that's too good. Stop searching immediately.
        return bestScore;
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

    return bestScore;
  }
}
