import type { Move } from "../../game/moveMaking/move.ts";
import type { Position } from "../../game/Position.ts";
import type { Engine } from "../Engine.ts";
import type { Evaluation } from "../evaluation/Evaluation.ts";
import { evaluateV3 } from "../evaluation/evaluationV3.ts";
import { MinimaxV7 } from "../minimaxEngines/v7.ts";
import type { SearchContext } from "../searchContext.ts";
import type { EngineName } from "./engineList.ts";
import type { Bondmonkey } from "./type.ts";

export class BondmonkeyV11 implements Bondmonkey {
  static readonly name = "BondmonkeyV11";
  static readonly description = "Adds killer moves and history heuristic";

  private readonly engine: Engine;
  private readonly evaluation: Evaluation;

  constructor(maxDepth: number = 6) {
    this.engine = new MinimaxV7(maxDepth);
    this.evaluation = evaluateV3;
  }

  newGame(): void {
    this.engine.newGame();
  }

  search(pos: Position, ctx: SearchContext): Move {
    return this.engine.search(pos, this.evaluation, ctx);
  }

  get name(): EngineName {
    return BondmonkeyV11.name;
  }
  
  get depthOfPrevSearch(): number {
    return this.engine.depthReached;
  }
}
