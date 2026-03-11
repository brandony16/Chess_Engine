import type Move from "../game/moveMaking/move.ts";
import type { Engine } from "./Engine.ts";
import { Position } from "../game/Position.ts";

export function createRandomEngine(rng: () => number): Engine {
  return {
    name: "Random",

    search(pos: Position, maxTimeMs: number): Move {
      const moves = pos.generateLegalMoves();
      return moves[Math.floor(rng() * moves.length)];
    },
  };
}
