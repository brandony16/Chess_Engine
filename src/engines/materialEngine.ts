import type Move from "../game/moveMaking/move.ts";
import type { Engine } from "./Engine.ts";
import { Position } from "../game/Position.ts";
import { evaluateMaterial } from "./evaluation/materialEvaluation.ts";

export function createMaterialEngine(): Engine {
  return {
    name: "Material",

    search(pos: Position, maxTimeMs: number): Move {
      const moves = pos.generateLegalMoves();

      let bestMove = moves[0];
      let bestScore = -Infinity;

      for (const move of moves) {
        pos.makeMove(move);

        const score = -evaluateMaterial(pos);

        pos.unmakeMove();

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }

      return bestMove;
    },
  };
}
