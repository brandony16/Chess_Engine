import { moreThanOne } from "../game/bb.ts";
import type { Move } from "../game/moveMaking/move.ts";
import { Position } from "../game/Position.ts";
import type { Engine } from "./Engine.ts";
import { DEFAULT_EVAL_WEIGHTS } from "./evaluation/Evaluation.ts";
import type { SearchContext } from "./searchContext.ts";
import type { Evaluation } from "./evaluation/Evaluation.ts";

export function createMaterialEngine(): Engine {
  return {
    newGame(): void {},

    search(pos: Position, evaluate: Evaluation, ctx: SearchContext): Move {
      pos.searchPly = 0;
      const numMoves = pos.generatePseudoLegalMoves();
      const checkers = pos.getCheckers();
      const pinned = pos.getPinnedPieces();
      const doubleCheck = moreThanOne(checkers[0], checkers[1]);

      let bestMove = pos.moveBuffer[0];
      let bestScore = -Infinity;

      for (let i = 0; i < numMoves; i++) {
        const move = pos.moveBuffer[i];
        if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;

        pos.makeMove(move);
        const score = -evaluate(pos, DEFAULT_EVAL_WEIGHTS);
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
