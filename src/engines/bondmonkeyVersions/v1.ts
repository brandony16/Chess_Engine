import type { Move } from "../../game/moveMaking/move.ts";
import type { Position } from "../../game/Position.ts";
import type { Engine } from "../Engine.ts";
import {
  DEFAULT_EVAL_WEIGHTS,
  type Evaluation,
} from "../evaluation/Evaluation.ts";
import { evaluateV1 } from "../evaluation/evaluationV1.ts";
import { createRandomEngine } from "../randomEngine.ts";
import type { SearchContext } from "../searchContext.ts";
import type { EngineName } from "./engineList.ts";
import type { Bondmonkey } from "./type.ts";

export class BondmonkeyV1 implements Bondmonkey {
  static readonly name = "BondmonkeyV1";
  static readonly description = "Plays random moves";

  private readonly engine: Engine;
  private readonly evaluation: Evaluation;

  constructor(rng: () => number = Math.random) {
    this.engine = createRandomEngine(rng);
    this.evaluation = evaluateV1;
  }

  newGame(): void {}

  search(pos: Position, ctx: SearchContext): Move {
    return this.engine.search(pos, this.evaluation, ctx);
  }

  get name(): EngineName {
    return BondmonkeyV1.name;
  }

  get depthOfPrevSearch(): number {
    return this.engine.depthReached;
  }

  getEval(pos: Position): number {
    return this.evaluation(pos, DEFAULT_EVAL_WEIGHTS);
  }
}
