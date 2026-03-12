import type { Engine } from "./Engine.ts";
import { Position } from "../game/Position.ts";
import type { Move } from "../game/moveMaking/move.ts";

export function createRandomEngine(rng: () => number): Engine {
  return {
    name: "Random",

    search(pos: Position, maxTimeMs: number): Move {
      pos.searchPly = 0;
      const moveNum = pos.generateLegalMoves();
      return pos.moveBuffer[Math.floor(rng() * moveNum)];
    },
  };
}
