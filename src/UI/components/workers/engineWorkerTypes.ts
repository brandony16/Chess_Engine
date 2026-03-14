import type { Move } from "../../../game/moveMaking/move.ts";
import type { Position } from "../../../game/Position.ts";

export type EnginePost = {
  pos: Position;
  engine: string;
  timeLimit: number;
  depth: number;
};

export type EngineResponse = {
  move: Move;
}