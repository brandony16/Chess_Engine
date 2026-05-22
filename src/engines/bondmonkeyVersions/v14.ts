import type { Move } from "../../game/moveMaking/move.ts";
import type { Position } from "../../game/Position.ts";
import type { Engine } from "../Engine.ts";
import type { Evaluation } from "../evaluation/Evaluation.ts";
import { evaluateV5 } from "../evaluation/evaluationV5.ts";
import { MinimaxV8 } from "../minimaxEngines/v8.ts";
import { MinimaxV9 } from "../minimaxEngines/v9.ts";
import type { SearchContext } from "../searchContext.ts";
import type { Bondmonkey } from "./type.ts";

export class BondmonkeyV14 implements Bondmonkey {
  static readonly name = "BondmonkeyV14";
  static readonly description = "Evaluates the pawn structure";

  private readonly engine: Engine;
  private readonly evaluation: Evaluation;

  constructor(maxDepth: number = 6) {
    this.engine = new MinimaxV9(maxDepth);
    this.evaluation = evaluateV5;
  }

  newGame(): void {
    this.engine.newGame();
  }

  search(pos: Position, ctx: SearchContext): Move {
    return this.engine.search(pos, this.evaluation, ctx);
  }
}
