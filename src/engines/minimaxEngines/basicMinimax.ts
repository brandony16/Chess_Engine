import { ABORT_SCORE, type Engine } from "../Engine.ts";
import { MAX_MOVES, Position } from "../../game/Position.ts";
import { evaluateMaterial } from "../evaluation/materialEvaluation.ts";
import {
  DEFAULT_EVAL_WEIGHTS,
  MATE_SCORE,
  type EvalWeights,
} from "../evaluation/Evaluation.ts";
import type { Move } from "../../game/moveMaking/move.ts";
import { moreThanOne } from "../../game/bb.ts";
import type { SearchContext } from "../searchContext.ts";

/**
 * Engine that implements a basic minimax search. Should mainly be used for testing the
 */
export class MinimaxV1 implements Engine {
  readonly name: string;
  readonly description: string;

  private readonly weights: EvalWeights;
  depth: number;

  constructor(depth: number) {
    this.name = "MinimaxV1";
    this.description = "Searches nodes up to the specified depth";
    this.weights = DEFAULT_EVAL_WEIGHTS;
    this.depth = depth;
  }

  newGame(): void {}

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

    for (let i = 0; i < moveNum; i++) {
      const move = pos.moveBuffer[start + i];

      if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;

      pos.makeMove(move);

      const score = -this.#negamax(pos, depth - 1, ctx);

      pos.unmakeMove();

      if (ctx.aborted) return bestMove;

      if (score > bestScore) {
        bestMove = move;
        bestScore = score;
      }
    }

    return bestMove;
  }

  #negamax(pos: Position, depth: number, ctx: SearchContext): number {
    if (ctx.tick()) return ABORT_SCORE;

    if (depth === 0) {
      return evaluateMaterial(pos, this.weights);
    }

    const start = pos.searchPly * MAX_MOVES;
    const moves = pos.generatePseudoLegalMoves();
    const checkers = pos.getCheckers();
    const pinned = pos.getPinnedPieces();
    const doubleCheck = moreThanOne(checkers[0], checkers[1]);

    let bestScore = -Infinity;
    let legalCount = 0;
    for (let i = 0; i < moves; i++) {
      const move = pos.moveBuffer[start + i];

      if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;
      legalCount++;

      pos.makeMove(move);

      const score = -this.#negamax(pos, depth - 1, ctx);

      pos.unmakeMove();

      if (ctx.aborted) return ABORT_SCORE;

      if (score > bestScore) {
        bestScore = score;
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
