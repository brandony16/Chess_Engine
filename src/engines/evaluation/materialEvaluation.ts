import { popcount } from "../../game/bb.ts";
import { WHITE } from "../../game/chessConstants.ts";
import { Position } from "../../game/Position.ts";
import { type EvalWeights } from "./Evaluation.ts";

export function evaluateMaterial(pos: Position, weights: EvalWeights): number {
  let matEval = 0;
  const pieceWeights = weights.pieceWeights;
  for (let pt = 1; pt <= 6; pt++) {
    const value = pieceWeights[pt];
    matEval += value * popcount(pos.bbsLo[pt], pos.bbsHi[pt]);
    matEval -= value * popcount(pos.bbsLo[pt + 6], pos.bbsHi[pt + 6]);
  }

  return pos.sideToMove === WHITE ? matEval : -matEval;
}
