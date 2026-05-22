import type { Move } from "../../game/moveMaking/move.ts";
import type { Position } from "../../game/Position.ts";
import type { Engine } from "../Engine.ts";
import type { Evaluation } from "../evaluation/Evaluation.ts";
import { evaluateV4 } from "../evaluation/evaluationv4.ts";
import { MinimaxV8 } from "../minimaxEngines/v8.ts";
import type { SearchContext } from "../searchContext.ts";
import type { EngineName } from "./engineList.ts";
import type { Bondmonkey } from "./type.ts";

export class BondmonkeyV13 implements Bondmonkey {
  static readonly name = "BondmonkeyV13";
  static readonly description = "Adds endgame psqt";

  private readonly engine: Engine;
  private readonly evaluation: Evaluation;

  constructor(maxDepth: number = 6) {
    this.engine = new MinimaxV8(maxDepth);
    this.evaluation = evaluateV4;
  }

  newGame(): void {
    this.engine.newGame();
  }

  search(pos: Position, ctx: SearchContext): Move {
    return this.engine.search(pos, this.evaluation, ctx);
  }

  get name(): EngineName {
    return BondmonkeyV13.name;
  }
  
  get depthOfPrevSearch(): number {
    return this.engine.depthReached;
  }
}
