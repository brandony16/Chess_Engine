import type { Move } from "../../game/moveMaking/move.ts";
import type { Position } from "../../game/Position.ts";
import type { Engine } from "../Engine.ts";
import type { Evaluation } from "../evaluation/Evaluation.ts";
import { evaluateV3 } from "../evaluation/evaluationV3.ts";
import { MinimaxV6 } from "../minimaxEngines/v6.ts";
import type { SearchContext } from "../searchContext.ts";
import type { Bondmonkey } from "./type.ts";

export class BondmonkeyV10 implements Bondmonkey {
  static readonly name = "BondmonkeyV10";
  static readonly description = "Keeps aborted search results";

  private readonly engine: Engine;
  private readonly evaluation: Evaluation;

  constructor(maxDepth: number = 6) {
    this.engine = new MinimaxV6(maxDepth);
    this.evaluation = evaluateV3;
  }

  newGame(): void {
    this.engine.newGame();
  }

  search(pos: Position, ctx: SearchContext): Move {
    return this.engine.search(pos, this.evaluation, ctx);
  }
}
