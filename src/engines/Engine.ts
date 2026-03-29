import type { Move } from "../game/moveMaking/move.ts";
import type { Position } from "../game/Position.ts";
import type { SearchContext } from "./searchContext.ts";

export type Engine = {
  readonly name: string;
  search(pos: Position, ctx: SearchContext): Move;
}
