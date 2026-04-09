import type { Move } from "../../game/moveMaking/move.ts";
import type { Position } from "../../game/Position.ts";
import type { Engine } from "../Engine.ts";
import { createMaterialEngine } from "../materialEngine.ts";
import type { SearchContext } from "../searchContext.ts";
import type { Bondmonkey } from "./type.ts";

export class BondmonkeyV2 implements Bondmonkey {
  static readonly name = "BondmonkeyV2";
  static readonly description =
    "Makes moves based off the best immediate material gain";

  private engine: Engine;

  constructor() {
    this.engine = createMaterialEngine();
  }

  newGame(): void {}

  search(pos: Position, ctx: SearchContext): Move {
    return this.engine.search(pos, ctx);
  }
}
