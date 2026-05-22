import type { Move } from "../../game/moveMaking/move.ts";
import type { Position } from "../../game/Position.ts";
import type { SearchContext } from "../searchContext.ts";
import type { EngineName } from "./engineList.ts";

export interface Bondmonkey {
  search(pos: Position, ctx: SearchContext): Move;
  newGame(): void;
  get name(): EngineName;
  get depthOfPrevSearch(): number;
}
