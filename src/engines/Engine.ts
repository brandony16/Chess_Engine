import type Move from "../game/moveMaking/move.ts";
import type { Position } from "../game/Position.ts";

export type Engine = {
  name: string;
  search(pos: Position, maxTimeMs: number): Move;
};
