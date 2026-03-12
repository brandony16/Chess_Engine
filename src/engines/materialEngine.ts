import type { Move } from "../game/moveMaking/move.ts";
import { Position } from "../game/Position.ts";
import type { Engine } from "./Engine.ts";
import { evaluateMaterial } from "./evaluation/materialEvaluation.ts";

export function createMaterialEngine(): Engine {
  return {
    name: "Material",

    search(pos: Position, maxTimeMs: number): Move {
      pos.searchPly = 0;
      const numMoves = pos.generateLegalMoves();

      let bestMove = pos.moveBuffer[0];
      let bestScore = -Infinity;

      for (let i = 0; i < numMoves; i++) {
        const move = pos.moveBuffer[i];
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
