import type { Engine } from "../../Engine.ts";
import { MAX_MOVES, Position } from "../../../game/Position.ts";
import { evaluateMaterial } from "../../evaluation/materialEvaluation.ts";
import {
  DEFAULT_EVAL_WEIGHTS,
  MATE_SCORE,
  type EvalWeights,
} from "../../evaluation/Evaluation.ts";
import type { Move } from "../../../game/moveMaking/move.ts";
import { moreThanOne } from "../../../game/bb.ts";
import type { SearchContext } from "../../searchContext.ts";

/**
 * Engine that implements a basic minimax search. Should mainly be used for testing the 
 */
export class MinimaxV1 implements Engine {
  readonly name: string;
  nodesSearched: number;
  depth: number;
  private readonly weights: EvalWeights;

  constructor(depth: number) {
    this.name = "MinimaxV1";
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

      const score = -this.#negamax(pos, this.depth - 1);

      pos.unmakeMove();

      if (score > bestScore) {
        bestMove = move;
        bestScore = score;
      }
    }

    return bestMove;
  }

  #negamax(pos: Position, depth: number) {
    this.nodesSearched++;

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

      const score = -this.#negamax(pos, depth - 1);

      pos.unmakeMove();

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
