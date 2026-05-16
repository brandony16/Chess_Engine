const MINOR_PIECE_PHASE_WEIGHT = 1; // bishops and knights
const ROOK_PHASE_WEIGHT = 2;
const QUEEN_PHASE_WEIGHT = 4;
const NO_WEIGHT = 0; // kings and pawns have no endgame weight

export const PHASE_WEIGHTS = [
  NO_WEIGHT, // no piece
  NO_WEIGHT, // wp
  MINOR_PIECE_PHASE_WEIGHT, // wn
  MINOR_PIECE_PHASE_WEIGHT, // wb
  ROOK_PHASE_WEIGHT,
  QUEEN_PHASE_WEIGHT,
  NO_WEIGHT, // wk
  NO_WEIGHT, // bp
  MINOR_PIECE_PHASE_WEIGHT, // bn
  MINOR_PIECE_PHASE_WEIGHT, // bb
  ROOK_PHASE_WEIGHT,
  QUEEN_PHASE_WEIGHT,
  NO_WEIGHT, // bk
] as const;

export const MAX_PHASE =
  8 * MINOR_PIECE_PHASE_WEIGHT + 4 * ROOK_PHASE_WEIGHT + 2 * QUEEN_PHASE_WEIGHT;
