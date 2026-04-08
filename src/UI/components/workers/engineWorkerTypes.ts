import type { SearchContext } from "../../../engines/searchContext.ts";
import type { Move } from "../../../game/moveMaking/move.ts";
import type { Position } from "../../../game/Position.ts";

export type EnginePost = {
  pos: Position;
  engine: string;
  depth: number;
  ctx: SearchContext;
};

export type EngineResponse = {
  move: Move;
};
