/**
 * Piece square tables store values for where pieces "should" be placed.
 * It rewards knights being centralized, for example.
 * Tables were inspired and tweaked from the Chess Programming Wiki's
 * Simplified Evaluation Function page.
 * https://www.chessprogramming.org/Simplified_Evaluation_Function
 */

/**
 * Pawns should take center space, and pawns in front of the king
 * should not move frequently. Also pawns are rewarded for getting
 * closer to promotion
 */

// prettier-ignore
const MG_PAWN_PSQT = new Int16Array([
   0,  0,  0,  0,  0,  0,  0,  0,
   50, 50, 50, 50, 50, 50, 50, 50, // 7th rank
   10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0, 10, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5, // 2nd rank
   0,  0,  0,  0,  0,  0,  0,  0,
]);

// prettier-ignore
const EG_PAWN_PSQT = new Int16Array([
   0,  0,  0,  0,  0,  0,  0,  0,
  80, 80, 80, 80, 80, 80, 80, 80,
  50, 50, 50, 50, 50, 50, 50, 50,
  30, 30, 30, 30, 30, 30, 30, 30,
  20, 20, 20, 20, 20, 20, 20, 20,
  10, 10, 10, 10, 10, 10, 10, 10,
  10, 10, 10, 10, 10, 10, 10, 10,
   0,  0,  0,  0,  0,  0,  0,  0
]);

/**
 * Knights should be on central squares as they have limited use
 * at the edges of the board.
 */
// prettier-ignore
const MG_KNIGHT_PSQT = new Int16Array([
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 25, 25, 15,  5,-30,
  -30,  0, 15, 25, 25, 15,  0,-30,
  -30,  5, 20, 15, 15, 20,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
]);

// prettier-ignore
const EG_KNIGHT_PSQT = new Int16Array([
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 25, 25, 15,  5,-30,
  -30,  0, 15, 25, 25, 15,  0,-30,
  -30,  5, 20, 15, 15, 20,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
]);

/**
 * Encourage bishops to centralize and be on good diagonals.
 */
// prettier-ignore
const MG_BISHOP_PSQT = new Int16Array([
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
]);

// prettier-ignore
const EG_BISHOP_PSQT = new Int16Array([
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
]);

/**
 * Encourage the rooks to centralize and move to the opponent's
 * second rank.
 */
// prettier-ignore
const MG_ROOK_PSQT = new Int16Array([
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  5,  5,  5,  5,  0,  0
]);

// prettier-ignore
const EG_ROOK_PSQT = new Int16Array([
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  5,  5,  5,  5,  0,  0
]);

/**
 * Generally encourage the queen to be centralized, where it can be
 * the most active.
 */
// prettier-ignore
const MG_QUEEN_PSQT = new Int16Array([
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
]);

// prettier-ignore
const EG_QUEEN_PSQT = new Int16Array([
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
]);

/**
 * Encourage king to castle and be behind the pawns
 */
// prettier-ignore
const MG_KING_PSQT = new Int16Array([
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
]);

// prettier-ignore
const EG_KING_PSQT = new Int16Array([
  -20,-10,-10,-10,-10,-10,-10,-20,
  -5,  0,  5,  5,  5,  5,  0, -5,
  -10,-5,  20, 30, 30, 20, -5,-10,
  -15,-10, 35, 45, 45, 35,-10,-15,
  -20,-15, 30, 40, 40, 30,-15,-20,
  -25,-20, 20, 25, 25, 20,-20,-25,
  -30,-25,  0,  0,  0,  0,-25,-30,
  -50,-30,-30,-30,-30,-30,-30,-50
]);

/**
 * All Piece Square Tables
 */
export const MG_PSQT = [
  [], // placeholder for NO_PIECE
  MG_PAWN_PSQT,
  MG_KNIGHT_PSQT,
  MG_BISHOP_PSQT,
  MG_ROOK_PSQT,
  MG_QUEEN_PSQT,
  MG_KING_PSQT,
];

export const EG_PSQT = [
  [],
  EG_PAWN_PSQT,
  EG_KNIGHT_PSQT,
  EG_BISHOP_PSQT,
  EG_ROOK_PSQT,
  EG_QUEEN_PSQT,
  EG_KING_PSQT,
];
