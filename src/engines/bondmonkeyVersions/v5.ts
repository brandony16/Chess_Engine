import type { Move } from "../../game/moveMaking/move.ts";
import type { Position } from "../../game/Position.ts";
import type { Engine } from "../Engine.ts";
import type { Evaluation } from "../evaluation/Evaluation.ts";
import { evaluateV1 } from "../evaluation/evaluationV1.ts";
import { MinimaxV3 } from "../minimaxEngines/moveOrdering.ts";
import type { SearchContext } from "../searchContext.ts";
import type { EngineName } from "./engineList.ts";
import type { Bondmonkey } from "./type.ts";

export class BondmonkeyV5 implements Bondmonkey {
  static readonly name = "BondmonkeyV5";
  static readonly description = "Searches consequential moves first";

  private readonly engine: Engine;
  private readonly evaluation: Evaluation;

  constructor(maxDepth: number = 6) {
    this.engine = new MinimaxV3(maxDepth);
    this.evaluation = evaluateV1;
  }

  newGame(): void {
    this.engine.newGame();
  }

  search(pos: Position, ctx: SearchContext): Move {
    return this.engine.search(pos, this.evaluation, ctx);
  }

  get name(): EngineName {
    return BondmonkeyV5.name;
  }
  
  get depthOfPrevSearch(): number {
    return this.engine.depthReached;
  }
}
