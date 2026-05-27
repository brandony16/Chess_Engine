import type { Move } from "../game/moveMaking/move.ts";
import type { Position } from "../game/Position.ts";
import type { Evaluation } from "./evaluation/Evaluation.ts";
import type { SearchContext } from "./searchContext.ts";

export type Engine = {
  depth: number;
  depthReached: number;

  search(pos: Position, evaluate: Evaluation, ctx: SearchContext): Move;
  newGame(): void;
};

export const ABORT_SCORE = 90_000_000;
export const MAX_SEARCH_PLY = 64;
export const INFINITY = 100_000_000;
