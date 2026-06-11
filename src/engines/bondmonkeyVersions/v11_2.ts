import type { Move } from "../../game/moveMaking/move.ts";
import type { Position } from "../../game/Position.ts";
import type { Engine } from "../Engine.ts";
import { DEFAULT_EVAL_WEIGHTS, type Evaluation } from "../evaluation/Evaluation.ts";
import { evaluateV3 } from "../evaluation/evaluationV3.ts";
import { MinimaxV7 } from "../minimaxEngines/v7.ts";
import { MinimaxV7_2 } from "../minimaxEngines/v7_2.ts";
import type { SearchContext } from "../searchContext.ts";
import type { EngineName } from "./engineList.ts";
import type { Bondmonkey } from "./type.ts";

export class BondmonkeyV11_2 implements Bondmonkey {
  static readonly name = "BondmonkeyV11_2";
  static readonly description =
    "Adds history heuristic for better move ordering";

  private readonly engine: Engine;
  private readonly evaluation: Evaluation;

  constructor(maxDepth: number = 6) {
    this.engine = new MinimaxV7_2(maxDepth);
    this.evaluation = evaluateV3;
  }

  newGame(): void {
    this.engine.newGame();
  }

  search(pos: Position, ctx: SearchContext): Move {
    return this.engine.search(pos, this.evaluation, ctx);
  }

  get name(): EngineName {
    return BondmonkeyV11_2.name;
  }

  get depthOfPrevSearch(): number {
    return this.engine.depthReached;
  }

  getEval(pos: Position): number {
    return this.evaluation(pos, DEFAULT_EVAL_WEIGHTS);
  }
}
