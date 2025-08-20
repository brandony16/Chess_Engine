import * as C from "../../../constants.mjs";
import { pieceAt } from "../../../pieceGetters.mjs";
import { getAllIndicies } from "../../../pieceIndicies.mjs";

const PIECE_PHASE_WEIGHTS = {
  [C.WHITE_PAWN]: 0,
  [C.BLACK_PAWN]: 0,
  [C.WHITE_KNIGHT]: 1,
  [C.BLACK_KNIGHT]: 1,
  [C.WHITE_BISHOP]: 1,
  [C.BLACK_BISHOP]: 1,
  [C.WHITE_ROOK]: 1,
  [C.WHITE_ROOK]: 2,
  [C.BLACK_ROOK]: 2,
  [C.WHITE_QUEEN]: 4,
  [C.BLACK_QUEEN]: 4,
  [C.WHITE_KING]: 0,
  [C.BLACK_KING]: 0,
};

// 2 Queens, 8 Bishops and Knights, 4 Rooks
export const MAX_PHASE = 24;

/**
 * Calculates the phase of the game based off of material.
 *
 * @returns {number} - the phase. Higher is earlier in the game
 */
export const calculatePhase = () => {
  const pieceIndices = getAllIndicies();

  let phase = 0;
  for (const index of pieceIndices) {
    const piece = pieceAt[index];

    phase += PIECE_PHASE_WEIGHTS[piece];
  }

  if (phase < 0) phase = 0;
  if (phase > MAX_PHASE) phase = MAX_PHASE;
  return phase;
};

/**
 * Blends between a middlegame weight and endgame weight.
 * Used in piece square tables and mobility.
 *
 * @param {number} mgScore - the weight in the middlegame
 * @param {number} egScore - the weights in the endgame
 * @param {number} phase - the phase of the game
 */
export const blendWithPhase = (mgScore, egScore, phase) => {
  return Math.round(
    (mgScore * phase + egScore * (MAX_PHASE - phase)) / MAX_PHASE
  );
};
