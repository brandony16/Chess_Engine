import type { Engine } from "../../Engine.ts";
import { MAX_MOVES, Position } from "../../../game/Position.ts";
import { evaluateMaterial } from "../../evaluation/materialEvaluation.ts";
import { WHITE } from "../../../game/chessConstants.ts";
import { MATE_SCORE } from "../../evaluation/Evaluation.ts";
import type { Move } from "../../../game/moveMaking/move.ts";

export class MinimaxV1 implements Engine {
  name: string;
  nodesSearched: number;

  constructor() {
    this.name = "MinimaxV1";
    this.nodesSearched = 0;
  }

  search(pos: Position, maxTimeMs: number): Move {
    pos.searchPly = 0;
    this.nodesSearched = 0; // reset node count
    const depth = 2;

    const moveNum = pos.generateLegalMoves();

    let bestMove = pos.moveBuffer[0];
    let bestScore = -Infinity;

    for (let i = 0; i < moveNum; i++) {
      const move = pos.moveBuffer[i];

      pos.makeMove(move);

      const score = -this.#negamax(pos, depth - 1);

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

    if (!pos.hasLegalMove()) {
      if (pos.isInCheck(pos.sideToMove)) {
        return MATE_SCORE;
      }
      return 0;
    }

    if (depth === 0) {
      const sign = pos.sideToMove === WHITE ? 1 : -1;
      return sign * evaluateMaterial(pos);
    }

    const start = pos.searchPly * MAX_MOVES;
    const moves = pos.generateLegalMoves();

    let bestScore = -Infinity;
    for (let i = 0; i < moves; i++) {
      const move = pos.moveBuffer[start + i];

      pos.makeMove(move);

      const score = -this.#negamax(pos, depth - 1);

      pos.unmakeMove();

      if (score > bestScore) {
        bestScore = score;
      }
    }

    return bestScore;
  }
}
