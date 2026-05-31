import { lsb, popcount } from "../../game/bb.ts";
import { WHITE } from "../../game/chessConstants.ts";
import { Position } from "../../game/Position.ts";
import { flip } from "./evalComponents/PestoTables.ts";
import { MG_PSQT } from "./evalComponents/PieceSquareTables.ts";
import { type EvalWeights } from "./Evaluation.ts";

/**
 * Version 2 of evaluation. Incorporates Piece Square Tables
 */
export function evaluateV2(pos: Position, weights: EvalWeights): number {
  let evaluation = 0;
  const pieceWeights = weights.pieceWeights;
  for (let pt = 1; pt <= 6; pt++) {
    const value = pieceWeights[pt];
    evaluation += value * popcount(pos.bbsLo[pt], pos.bbsHi[pt]);
    evaluation -= value * popcount(pos.bbsLo[pt + 6], pos.bbsHi[pt + 6]);

    const PQST = MG_PSQT[pt];
    let wBBLo = pos.bbsLo[pt],
      wBBHi = pos.bbsHi[pt];
    while (wBBLo || wBBHi) {
      const square = lsb(wBBLo, wBBHi);
      if (wBBLo) wBBLo &= wBBLo - 1;
      else wBBHi &= wBBHi - 1;

      evaluation += PQST[flip(square)];
    }

    let bBBLo = pos.bbsLo[pt + 6],
      bBBHi = pos.bbsHi[pt + 6];
    while (bBBLo || bBBHi) {
      const square = lsb(bBBLo, bBBHi);
      if (bBBLo) bBBLo &= bBBLo - 1;
      else bBBHi &= bBBHi - 1;

      evaluation -= PQST[square];
    }
  }

  return pos.sideToMove === WHITE ? evaluation : -evaluation;
}
