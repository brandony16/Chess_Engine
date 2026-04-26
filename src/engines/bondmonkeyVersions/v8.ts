import type { Move } from "../../game/moveMaking/move.ts";
import type { Position } from "../../game/Position.ts";
import type { Engine } from "../Engine.ts";
import type { Evaluation } from "../evaluation/Evaluation.ts";
import { evaluatePSQT } from "../evaluation/psqtEvaluation.ts";
import { MinimaxV5 } from "../minimaxEngines/transposTable.ts";
import type { SearchContext } from "../searchContext.ts";
import type { Bondmonkey } from "./type.ts";

export class BondmonkeyV8 implements Bondmonkey {
  static readonly name = "BondmonkeyV8";
  static readonly description = "Saves previous search results";

  private readonly engine: Engine;
  private readonly evaluation: Evaluation;

  constructor(maxDepth: number = 6) {
    this.engine = new MinimaxV5(maxDepth);
    this.evaluation = evaluatePSQT;
  }

  newGame(): void {
    this.engine.newGame();
  }

  search(pos: Position, ctx: SearchContext): Move {
    return this.engine.search(pos, this.evaluation, ctx);
  }
}
