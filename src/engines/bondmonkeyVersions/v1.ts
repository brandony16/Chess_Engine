import type { Move } from "../../game/moveMaking/move.ts";
import type { Position } from "../../game/Position.ts";
import type { Engine } from "../Engine.ts";
import { createRandomEngine } from "../randomEngine.ts";
import type { SearchContext } from "../searchContext.ts";
import type { Bondmonkey } from "./type.ts";

export class BondmonkeyV1 implements Bondmonkey {
  static readonly name = "BondmonkeyV1";
  static readonly description = "Plays random moves";

  private engine: Engine;

  constructor(rng: () => number = Math.random) {
    this.engine = createRandomEngine(rng);
  }

  newGame(): void {}

  search(pos: Position, ctx: SearchContext): Move {
    return this.engine.search(pos, ctx);
  }
}
