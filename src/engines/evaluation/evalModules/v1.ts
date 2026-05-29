import { lsb } from "../../../game/bb.ts";
import {
  NO_PIECE,
  WHITE,
  WHITE_ROOK,
  type Player,
  type Square,
} from "../../../game/chessConstants.ts";
import {
  isCastling,
  isEnPassant,
  moveCaptured,
  moveFrom,
  movePiece,
  movePromotion,
  moveTo,
  type Move,
} from "../../../game/moveMaking/move.ts";
import type { Position } from "../../../game/Position.ts";
import { MAX_SEARCH_PLY } from "../../Engine.ts";
import { forceKingToEdgeEndgameEval } from "../evalComponents/forceKingEdge.ts";
import {
  flip,
  PESTO_EG_TABLES,
  PESTO_MG_TABLES,
} from "../evalComponents/PestoTables.ts";
import { MAX_PHASE, PHASE_WEIGHTS } from "../evalComponents/phaseWeights.ts";
import { DEFAULT_PIECE_WEIGHTS, type EvaluationModule } from "../Evaluation.ts";

export default class EvaluationV1 implements EvaluationModule {
  private readonly pieceWeights: Int32Array = DEFAULT_PIECE_WEIGHTS;

  private material = 0;
  private mgScore = 0;
  private egScore = 0;
  private phase = 0;

  private materialHistory = new Int32Array(MAX_SEARCH_PLY);
  private mgHistory = new Int32Array(MAX_SEARCH_PLY);
  private egHistory = new Int32Array(MAX_SEARCH_PLY);
  private phaseHistory = new Int32Array(MAX_SEARCH_PLY);

  initializeEval(pos: Position): void {
    // same as evaluate v4, modified to store relevant scores
    let totalPhase = 0;

    let wMaterial = 0;
    let bMaterial = 0;

    // sum psqt values for mg and eg and multiply by endgame weight after
    let wMgPSQT = 0;
    let wEgPSQT = 0;
    let bMgPSQT = 0;
    let bEgPSQT = 0;
    for (let pt = 1; pt <= 6; pt++) {
      // basic material evaluation
      const value = this.pieceWeights[pt];

      const MG_PQST = PESTO_MG_TABLES[pt];
      const EG_PSQT = PESTO_EG_TABLES[pt];

      // calculate piece square table weights and phase
      let wBBLo = pos.bbsLo[pt],
        wBBHi = pos.bbsHi[pt];
      while (wBBLo || wBBHi) {
        const square = lsb(wBBLo, wBBHi);
        if (wBBLo) wBBLo &= wBBLo - 1;
        else wBBHi &= wBBHi - 1;

        wMaterial += value;

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

        bMaterial += value;

        bMgPSQT += MG_PQST[square];
        bEgPSQT += EG_PSQT[square];
        totalPhase += PHASE_WEIGHTS[pt + 6];
      }
    }

    this.phase = totalPhase;
    this.egScore = wEgPSQT - bEgPSQT;
    this.mgScore = wMgPSQT - bMgPSQT;
    this.material = wMaterial - bMaterial;
  }

  makeMoveUpdateEval(move: Move, ply: number, side: Player): void {
    let mg = this.mgScore;
    let eg = this.egScore;
    let phase = this.phase;
    let material = this.material;

    this.mgHistory[ply] = mg;
    this.egHistory[ply] = eg;
    this.phaseHistory[ply] = phase;
    this.materialHistory[ply] = material;

    const fromSq = moveFrom(move);
    const toSq = moveTo(move);
    const piece = movePiece(move);

    // -1 for black, 1 for white
    const colorSign = 1 - 2 * side;

    const tableIdx = side === WHITE ? piece : piece - 6;
    const fromSqIdx = side === WHITE ? flip(fromSq) : fromSq;
    const toSqIdx = side === WHITE ? flip(toSq) : toSq;

    // remove previous pesto values, add new pesto values
    mg -= PESTO_MG_TABLES[tableIdx][fromSqIdx] * colorSign;
    eg -= PESTO_EG_TABLES[tableIdx][fromSqIdx] * colorSign;

    const promo = movePromotion(move);
    const toTableIdx =
      promo !== NO_PIECE ? (side === WHITE ? promo : promo - 6) : tableIdx;
    mg += PESTO_MG_TABLES[toTableIdx][toSqIdx] * colorSign;
    eg += PESTO_EG_TABLES[toTableIdx][toSqIdx] * colorSign;

    if (promo !== NO_PIECE) {
      phase -= PHASE_WEIGHTS[tableIdx];
      phase += PHASE_WEIGHTS[toTableIdx];
      material -= colorSign * this.pieceWeights[tableIdx];
      material += colorSign * this.pieceWeights[toTableIdx];
    }

    const captured = moveCaptured(move);
    if (captured !== NO_PIECE) {
      let captureSq: Square;
      if (isEnPassant(move)) {
        captureSq = (side === WHITE ? toSq - 8 : toSq + 8) as Square;
      } else {
        captureSq = toSq;
      }

      // normally flip for white, but if white captured
      // we need the pesto value for black
      const capSqIdx = side === WHITE ? captureSq : flip(captureSq);
      const capTableIdx = side === WHITE ? captured - 6 : captured;

      // remove enemy piece by adding that value to the opponent
      mg += colorSign * PESTO_MG_TABLES[capTableIdx][capSqIdx];
      eg += colorSign * PESTO_EG_TABLES[capTableIdx][capSqIdx];

      phase -= PHASE_WEIGHTS[capTableIdx];

      material += colorSign * this.pieceWeights[capTableIdx];
    }

    if (isCastling(move)) {
      let rookFromSq: number;
      let rookToSq: number;

      // king moves right - kingside castle
      if (fromSq - toSq < 0) {
        // these are blacks rook values,
        // but we would flip it for white anyway
        rookFromSq = 63;
        rookToSq = 61;
      } else {
        rookFromSq = 56;
        rookToSq = 59;
      }

      // use WHITE_ROOK as ROOK b/c we know rooks are moving
      mg -= colorSign * PESTO_MG_TABLES[WHITE_ROOK][rookFromSq];
      eg -= colorSign * PESTO_EG_TABLES[WHITE_ROOK][rookFromSq];

      mg += colorSign * PESTO_MG_TABLES[WHITE_ROOK][rookToSq];
      eg += colorSign * PESTO_EG_TABLES[WHITE_ROOK][rookToSq];
    }

    this.mgScore = mg;
    this.egScore = eg;
    this.phase = phase;
    this.material = material;
  }

  restoreEval(ply: number): void {
    this.mgScore = this.mgHistory[ply];
    this.egScore = this.egHistory[ply];
    this.phase = this.phaseHistory[ply];
    this.material = this.materialHistory[ply];
  }

  makeNullMove(ply: number) {
    // for null move, just need to store current scores
    this.mgHistory[ply] = this.mgScore;
    this.egHistory[ply] = this.egScore;
    this.phaseHistory[ply] = this.phase;
    this.materialHistory[ply] = this.material;
  }

  getEval(pos: Position): number {
    const mgWeight = this.phase;
    const egWeight = MAX_PHASE - this.phase;

    // Multiply first, divide at the end, and force Smi with bitwise OR
    const psqtEval =
      ((this.mgScore * mgWeight + this.egScore * egWeight) / MAX_PHASE) | 0;

    const evaluation = this.material + psqtEval;

    // convert eval to be relative to the side to move (positive if winning, negative if losing)
    const friendlySide = pos.sideToMove;
    let relativeEval = friendlySide === WHITE ? evaluation : -evaluation;

    if (relativeEval > 0) {
      const endgameWeight = egWeight / MAX_PHASE;

      // returns relative to friendly side
      const kingPosWeight = forceKingToEdgeEndgameEval(
        pos.kingSq[friendlySide] as Square,
        pos.kingSq[friendlySide ^ 1] as Square,
        endgameWeight,
      );
      relativeEval += kingPosWeight | 0;
    }

    return relativeEval;
  }
}
