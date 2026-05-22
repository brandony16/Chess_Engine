import type { Engine } from "./Engine.ts";
import { Position } from "../game/Position.ts";
import type { Move } from "../game/moveMaking/move.ts";
import { moreThanOne } from "../game/bb.ts";
import type { SearchContext } from "./searchContext.ts";
import type { Evaluation } from "./evaluation/Evaluation.ts";

export function createRandomEngine(rng: () => number): Engine {
  return {
    depth: 0,
    depthReached: 0,

    newGame(): void {},

    search(pos: Position, evaluate: Evaluation, ctx: SearchContext): Move {
      pos.searchPly = 0;
      const moveNum = pos.generatePseudoLegalMoves();
      const checkers = pos.getCheckers();
      const pinned = pos.getPinnedPieces();
      const doubleCheck = moreThanOne(checkers[0], checkers[1]);

      const moves: number[] = [];
      for (let i = 0; i < moveNum; i++) {
        const move = pos.moveBuffer[i];
        if (pos.isLegal(move, checkers, pinned, doubleCheck)) {
          moves.push(pos.moveBuffer[i]);
        }
      }

      return moves[Math.floor(rng() * moves.length)];
    },
  };
}
