import type { Engine } from "../../../engines/Engine.ts";
import type { SearchContext } from "../../../engines/searchContext.ts";
import type { Move } from "../../../game/moveMaking/move.ts";
import type { Position } from "../../../game/Position.ts";

export type EnginePost = {
  pos: Position;
  engine: Engine;
  ctx: SearchContext;
};

export type EngineResponse = {
  move: Move;
};
