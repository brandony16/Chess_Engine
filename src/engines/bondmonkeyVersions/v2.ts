import type { Move } from "../../game/moveMaking/move.ts";
import type { Position } from "../../game/Position.ts";
import type { Engine } from "../Engine.ts";
import type { Evaluation } from "../evaluation/Evaluation.ts";
import { evaluateV1 } from "../evaluation/evaluationV1.ts";
import { createMaterialEngine } from "../materialEngine.ts";
import type { SearchContext } from "../searchContext.ts";
import type { Bondmonkey } from "./type.ts";

export class BondmonkeyV2 implements Bondmonkey {
  static readonly name = "BondmonkeyV2";
  static readonly description =
    "Makes moves based off the best immediate material gain";

  private readonly engine: Engine;
  private readonly evaluation: Evaluation;

  constructor() {
    this.engine = createMaterialEngine();
    this.evaluation = evaluateV1;
  }

  newGame(): void {}

  search(pos: Position, ctx: SearchContext): Move {
    return this.engine.search(pos, this.evaluation, ctx);
  }
}
