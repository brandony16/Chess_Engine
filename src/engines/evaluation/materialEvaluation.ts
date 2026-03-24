import { popcount } from "../../game/bb.ts";
import { PIECES, WHITE } from "../../game/chessConstants.ts";
import { Position } from "../../game/Position.ts";

type PieceWeights = {
  pawn: number;
  knight: number;
  bishop: number;
  rook: number;
  queen: number;
};

const weights = [
  0, 100, 320, 330, 500, 900, 20_000, -100, -320, -330, -500, -900, -20_000,
];

export function evaluateMaterial(pos: Position): number {
  let matEval = 0;
  for (const piece of PIECES) {
    matEval += weights[piece] * popcount(pos.bbsLo[piece], pos.bbsHi[piece]);
  }

  return pos.sideToMove === WHITE ? matEval : -matEval;
}
