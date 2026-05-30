import type { Move } from "../../game/moveMaking/move.ts";
import type { Position } from "../../game/Position.ts";
import type { Engine } from "../Engine.ts";
import EvaluationV5 from "../evaluation/evalModules/v5.ts";
import type { Evaluation, EvaluationModule } from "../evaluation/Evaluation.ts";
import { evaluateV5 } from "../evaluation/evaluationV5.ts";
import { MinimaxV10 } from "../minimaxEngines/v10.ts";
import { MinimaxV11 } from "../minimaxEngines/v11.ts";
import type { SearchContext } from "../searchContext.ts";
import type { EngineName } from "./engineList.ts";
import type { Bondmonkey } from "./type.ts";

export class BondmonkeyV17 implements Bondmonkey {
  static readonly name = "BondmonkeyV17";
  static readonly description = "Evaluates pawn structure";

  private readonly engine: Engine;
  private readonly evaluation: EvaluationModule;

  constructor(maxDepth: number = 6) {
    this.engine = new MinimaxV11(maxDepth);
    this.evaluation = new EvaluationV5();
  }

  newGame(): void {
    this.engine.newGame();
  }

  search(pos: Position, ctx: SearchContext): Move {
    return this.engine.search(pos, this.evaluation, ctx);
  }

  get name(): EngineName {
    return BondmonkeyV17.name;
  }

  get depthOfPrevSearch(): number {
    return this.engine.depthReached;
  }
}
