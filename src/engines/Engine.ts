import type { Move } from "../game/moveMaking/move.ts";
import type { Position } from "../game/Position.ts";
import type { EvalWeights } from "./evaluation/Evaluation.ts";

export type Engine = {
  name: string;
  weights?: EvalWeights
  search(pos: Position, maxTimeMs: number): Move;
}
