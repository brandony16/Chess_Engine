import type { Move } from "../../game/moveMaking/move.ts";
import type { Position } from "../../game/Position.ts";
import type { Engine } from "../Engine.ts";
import type { Evaluation } from "../evaluation/Evaluation.ts";
import { evaluateMaterial } from "../evaluation/materialEvaluation.ts";
import { createRandomEngine } from "../randomEngine.ts";
import type { SearchContext } from "../searchContext.ts";
import type { Bondmonkey } from "./type.ts";

export class BondmonkeyV1 implements Bondmonkey {
  static readonly name = "BondmonkeyV1";
  static readonly description = "Plays random moves";

  private readonly engine: Engine;
  private readonly evaluation: Evaluation;

  constructor(rng: () => number = Math.random) {
    this.engine = createRandomEngine(rng);
    this.evaluation = evaluateMaterial;
  }

  newGame(): void {}

  search(pos: Position, ctx: SearchContext): Move {
    return this.engine.search(pos, this.evaluation, ctx);
  }
}
