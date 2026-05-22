import { moreThanOne } from "../../game/bb.ts";
import type { Move } from "../../game/moveMaking/move.ts";
import { MAX_MOVES, type Position } from "../../game/Position.ts";
import { ABORT_SCORE, MAX_SEARCH_PLY, type Engine } from "../Engine.ts";
import {
  DEFAULT_EVAL_WEIGHTS,
  MATE_SCORE,
  type Evaluation,
  type EvalWeights,
} from "../evaluation/Evaluation.ts";
import { evaluateV1 } from "../evaluation/evaluationV1.ts";
import { scoreMoveForOrderingBasic } from "../moveScoring/basicScoring.ts";
import type { SearchContext } from "../searchContext.ts";

/**
 * Evolution of minimaxV2 that implements move ordering
 */
export class MinimaxV3 implements Engine {
  private readonly weights: EvalWeights;
  private evaluate: Evaluation;

  depth: number;
  depthReached: number;

  private scoreBuffer = new Int32Array(MAX_SEARCH_PLY * MAX_MOVES);

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

      bestMove = result;
    }
    if (log) {
      console.log(
        `Depth Searched: ${this.depthReached}\nNodes searched: ${ctx.nodesSearched}\n`,
      );
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

    const moveBuf = pos.moveBuffer;
    const scoreBuf = this.scoreBuffer;
    for (let i = 0; i < moveNum; i++) {
      scoreBuf[start + i] = scoreMoveForOrderingBasic(moveBuf[start + i]);
    }

    for (let i = 0; i < moveNum; i++) {
      this.#pickBestMove(moveBuf, start, i, moveNum);

      const move = moveBuf[start + i];

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
      return this.evaluate(pos, this.weights);
    }

    const start = pos.searchPly * MAX_MOVES;
    const moves = pos.generatePseudoLegalMoves();
    const checkers = pos.getCheckers();
    const pinned = pos.getPinnedPieces();
    const doubleCheck = moreThanOne(checkers[0], checkers[1]);

    const moveBuf = pos.moveBuffer;
    const scoreBuf = this.scoreBuffer;
    for (let i = 0; i < moves; i++) {
      scoreBuf[start + i] = scoreMoveForOrderingBasic(moveBuf[start + i]);
    }

    let legalCount = 0;
    for (let i = 0; i < moves; i++) {
      // Move best (highest scoring) move to the front of moveBuffer
      this.#pickBestMove(moveBuf, start, i, moves);

      const move = moveBuf[start + i];

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
    start: number,
    current: number,
    end: number,
  ) {
    let bestIdx = current;
    const buf = this.scoreBuffer;
    let bestScore = buf[start + current];

    for (let i = current + 1; i < end; i++) {
      if (buf[start + i] > bestScore) {
        bestScore = buf[start + i];
        bestIdx = i;
      }
    }

    if (bestIdx !== current) {
      // Swap moves
      const tmpMove = moveBuffer[start + current];
      moveBuffer[start + current] = moveBuffer[start + bestIdx];
      moveBuffer[start + bestIdx] = tmpMove;
      // Swap scores
      const tmpScore = buf[start + current];
      buf[start + current] = buf[start + bestIdx];
      buf[start + bestIdx] = tmpScore;
    }
  }
}
