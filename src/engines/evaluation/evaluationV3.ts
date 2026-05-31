import { lsb, popcount } from "../../game/bb.ts";
import {
  BLACK,
  BLACK_KING,
  WHITE,
  WHITE_KING,
  type Square,
} from "../../game/chessConstants.ts";
import { Position } from "../../game/Position.ts";
import { type EvalWeights } from "./Evaluation.ts";
import { MAX_PHASE, PHASE_WEIGHTS } from "./evalComponents/phaseWeights.ts";
import { forceKingToEdgeEndgameEval } from "./evalComponents/forceKingEdge.ts";
import { MG_PSQT } from "./evalComponents/PieceSquareTables.ts";
import { flip } from "./evalComponents/PestoTables.ts";

/**
 * Version 3 of evaluation. Adds king positioning weight in the endgame
 */
export function evaluateV3(pos: Position, weights: EvalWeights): number {
  let evaluation = 0;
  const pieceWeights = weights.pieceWeights;

  let totalPhase = 0;
  // add wpqst, qpsqtendgame, etc. vars and multiply by endgame weight after
  for (let pt = 1; pt <= 5; pt++) {
    // basic material evaluation
    const value = pieceWeights[pt];
    evaluation += value * popcount(pos.bbsLo[pt], pos.bbsHi[pt]);
    evaluation -= value * popcount(pos.bbsLo[pt + 6], pos.bbsHi[pt + 6]);

    // calculate piece square table weights and phase
    const PQST = MG_PSQT[pt];
    let wBBLo = pos.bbsLo[pt],
      wBBHi = pos.bbsHi[pt];
    while (wBBLo || wBBHi) {
      const square = lsb(wBBLo, wBBHi);
      if (wBBLo) wBBLo &= wBBLo - 1;
      else wBBHi &= wBBHi - 1;

      evaluation += PQST[flip(square)];
      totalPhase += PHASE_WEIGHTS[pt];
    }

    let bBBLo = pos.bbsLo[pt + 6],
      bBBHi = pos.bbsHi[pt + 6];
    while (bBBLo || bBBHi) {
      const square = lsb(bBBLo, bBBHi);
      if (bBBLo) bBBLo &= bBBLo - 1;
      else bBBHi &= bBBHi - 1;

      evaluation -= PQST[square];
      totalPhase += PHASE_WEIGHTS[pt + 6];
    }
  }

  // endgame weight is 1 when just kings and pawns and 0 when all pieces
  const endgameWeight = (MAX_PHASE - totalPhase) / MAX_PHASE;

  // weight king position by phase. king doesnt need to hide in the endgame
  evaluation +=
    MG_PSQT[WHITE_KING][flip(pos.kingSq[WHITE] as Square)] *
    (1 - endgameWeight);
  evaluation -= MG_PSQT[WHITE_KING][pos.kingSq[BLACK]] * (1 - endgameWeight);

  // convert eval to be relative to the side to move (positive if winning, negative if losing)
  const friendlySide = pos.sideToMove;
  let relativeEval = friendlySide === WHITE ? evaluation : -evaluation;

  if (relativeEval > 0) {
    // returns relative to friendly side
    const kingPosWeight = forceKingToEdgeEndgameEval(
      pos.kingSq[friendlySide] as Square,
      pos.kingSq[friendlySide ^ 1] as Square,
      endgameWeight,
    );
    relativeEval += kingPosWeight;
  }

  return relativeEval;
}
