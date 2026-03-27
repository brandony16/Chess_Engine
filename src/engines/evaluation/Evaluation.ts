import { WHITE_KING, type Piece } from "../../game/chessConstants.ts";
import type { Position } from "../../game/Position.ts";

export type Evaluation = (pos: Position, weights: EvalWeights) => number;

export const MATE_SCORE = 100_000;

// white king is last white piece. Anything larger is a black piece
export const pieceType = (piece: Piece): number =>
  piece > WHITE_KING ? piece - 6 : piece;

export interface EvalWeights {
  pieceWeights: Int32Array;
}
export const DEFAULT_EVAL_WEIGHTS: EvalWeights = {
  pieceWeights: new Int32Array([0, 100, 320, 330, 500, 900, 20_000]),
};
