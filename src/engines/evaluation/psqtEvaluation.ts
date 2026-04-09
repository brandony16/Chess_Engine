import { lsb, popcount } from "../../game/bb.ts";
import { WHITE } from "../../game/chessConstants.ts";
import { Position } from "../../game/Position.ts";
import { type EvalWeights } from "./Evaluation.ts";
import { PIECE_SQUARE_TABLES } from "./PieceSquareTables.ts";

/**
 * Version 2 of evaluation. Incorporates Piece Square Tables
 */
export function evaluatePSQT(pos: Position, weights: EvalWeights): number {
  let evaluation = 0;
  const pieceWeights = weights.pieceWeights;
  for (let pt = 1; pt <= 6; pt++) {
    const value = pieceWeights[pt];
    evaluation += value * popcount(pos.bbsLo[pt], pos.bbsHi[pt]);
    evaluation -= value * popcount(pos.bbsLo[pt + 6], pos.bbsHi[pt + 6]);

    const wPQST = PIECE_SQUARE_TABLES[pt];
    let wBBLo = pos.bbsLo[pt],
      wBBHi = pos.bbsHi[pt];
    while (wBBLo || wBBHi) {
      const square = lsb(wBBLo, wBBHi);
      if (wBBLo) wBBLo &= wBBLo - 1;
      else wBBHi &= wBBHi - 1;

      evaluation += wPQST[square];
    }

    const bPQST = PIECE_SQUARE_TABLES[pt + 6];
    let bBBLo = pos.bbsLo[pt + 6],
      bBBHi = pos.bbsHi[pt + 6];
    while (bBBLo || bBBHi) {
      const square = lsb(bBBLo, bBBHi);
      if (bBBLo) bBBLo &= bBBLo - 1;
      else bBBHi &= bBBHi - 1;

      evaluation -= bPQST[square];
    }
  }

  return pos.sideToMove === WHITE ? evaluation : -evaluation;
}
