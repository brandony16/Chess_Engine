import type { Move } from "../game/moveMaking/move.ts";
import type { Position } from "../game/Position.ts";
import type { Evaluation } from "./evaluation/Evaluation.ts";
import type { SearchContext } from "./searchContext.ts";

export type Engine = {
  depth?: number;

  search(pos: Position, evaluate: Evaluation, ctx: SearchContext): Move;
  newGame(): void;
};

export const ABORT_SCORE = 99_999_999;
export const MAX_SEARCH_PLY = 32;
export const INFINITY = 1_000_000_000;
