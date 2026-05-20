import { lsb } from "../../game/bb.ts";
import { WHITE, type Square } from "../../game/chessConstants.ts";
import { Position } from "../../game/Position.ts";
import { type EvalWeights } from "./Evaluation.ts";
import { MAX_PHASE, PHASE_WEIGHTS } from "./evalComponents/phaseWeights.ts";
import { forceKingToEdgeEndgameEval } from "./evalComponents/forceKingEdge.ts";
import {
  PESTO_EG_TABLES,
  PESTO_MG_TABLES,
} from "./evalComponents/PestoTables.ts";

function flip(sq: Square): Square {
  return (sq ^ 56) as Square; // flip rank, but not file
}

/**
 * Version 4 of evaluation. Uses PeSTO tables for both mg and eg, interpolating between each
 */
export function evaluateV4(pos: Position, weights: EvalWeights): number {
  let evaluation = 0;
  const pieceWeights = weights.pieceWeights;

  let totalPhase = 0;

  // sum psqt values for mg and eg and multiply by endgame weight after
  let wMgPSQT = 0;
  let wEgPSQT = 0;
  let bMgPSQT = 0;
  let bEgPSQT = 0;
  for (let pt = 1; pt <= 6; pt++) {
    // basic material evaluation
    const value = pieceWeights[pt];

    const MG_PQST = PESTO_MG_TABLES[pt];
    const EG_PSQT = PESTO_EG_TABLES[pt];

    // calculate piece square table weights and phase
    let wBBLo = pos.bbsLo[pt],
      wBBHi = pos.bbsHi[pt];
    while (wBBLo || wBBHi) {
      const square = lsb(wBBLo, wBBHi);
      if (wBBLo) wBBLo &= wBBLo - 1;
      else wBBHi &= wBBHi - 1;

      evaluation += value;

      // tables are from the perspecive of black, so flip for white
      wMgPSQT += MG_PQST[flip(square)];
      wEgPSQT += EG_PSQT[flip(square)];
      totalPhase += PHASE_WEIGHTS[pt];
    }

    let bBBLo = pos.bbsLo[pt + 6],
      bBBHi = pos.bbsHi[pt + 6];
    while (bBBLo || bBBHi) {
      const square = lsb(bBBLo, bBBHi);
      if (bBBLo) bBBLo &= bBBLo - 1;
      else bBBHi &= bBBHi - 1;

      evaluation -= value;

      bMgPSQT += MG_PQST[square];
      bEgPSQT += EG_PSQT[square];
      totalPhase += PHASE_WEIGHTS[pt + 6];
    }
  }

  // endgame weight is 1 when just kings and pawns and 0 when all pieces
  const endgameWeight = (MAX_PHASE - totalPhase) / MAX_PHASE;

  evaluation += wMgPSQT * (1 - endgameWeight) + wEgPSQT * endgameWeight;
  evaluation -= bMgPSQT * (1 - endgameWeight) + bEgPSQT * endgameWeight;

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
