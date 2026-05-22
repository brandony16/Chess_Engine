import type { Move } from "../../game/moveMaking/move.ts";
import type { Position } from "../../game/Position.ts";
import type { Engine } from "../Engine.ts";
import type { Evaluation } from "../evaluation/Evaluation.ts";
import { evaluateV1 } from "../evaluation/evaluationV1.ts";
import { MinimaxV2 } from "../minimaxEngines/abPruning.ts";
import type { SearchContext } from "../searchContext.ts";
import type { EngineName } from "./engineList.ts";
import type { Bondmonkey } from "./type.ts";

export class BondmonkeyV4 implements Bondmonkey {
  static readonly name = "BondmonkeyV4";
  static readonly description = "Adds pruning for more efficient searches";

  private readonly engine: Engine;
  private readonly evaluation: Evaluation;

  constructor(maxDepth: number = 6) {
    this.engine = new MinimaxV2(maxDepth);
    this.evaluation = evaluateV1;
  }

  newGame(): void {
    this.engine.newGame();
  }

  search(pos: Position, ctx: SearchContext): Move {
    return this.engine.search(pos, this.evaluation, ctx);
  }

  get name(): EngineName {
    return BondmonkeyV4.name;
  }
  
  get depthOfPrevSearch(): number {
    return this.engine.depthReached;
  }
}
