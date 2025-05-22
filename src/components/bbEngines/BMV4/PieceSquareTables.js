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
const WHITE_PAWN_PIECE_SQUARE_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10,-20,-20, 10, 10,  5,
   5, -5,-10,  0,  0,-10, -5,  5,
   0,  0, 10, 20, 20,  0,  0,  0,
   5,  5, 10, 25, 25, 10,  5,  5,
  10, 10, 20, 30, 30, 20, 10, 10,
  50, 50, 50, 50, 50, 50, 50, 50,
   0,  0,  0,  0,  0,  0,  0,  0,
];

const BLACK_PAWN_PIECE_SQUARE_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
   50, 50, 50, 50, 50, 50, 50, 50,
   10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0, 10, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
];

/**
 * Knights should be on central squares as they have limited use
 * at the edges of the board.
 */
const WHITE_KNIGHT_PIECE_SQUARE_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -30,  5, 20, 15, 15, 20,  5,-30,
  -30,  0, 15, 25, 25, 15,  0,-30,
  -30,  5, 15, 25, 25, 15,  5,-30,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
]

const BLACK_KNIGHT_PIECE_SQUARE_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 25, 25, 15,  5,-30,
  -30,  0, 15, 25, 25, 15,  0,-30,
  -30,  5, 20, 15, 15, 20,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
]

/**
 * Encourage bishops to centralize and be on good diagonals.
 */
const WHITE_BISHOP_PIECE_SQUARE_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
]

const BLACK_BISHOP_PIECE_SQUARE_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
]

/**
 * Encourage the rooks to centralize and move to the opponent's
 * second rank.
 */
const WHITE_ROOK_PIECE_SQUARE_TABLE = [
   0,  0,  5, 10, 10,  5,  0,  0,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   5, 10, 10, 10, 10, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
]

const BLACK_ROOK_PIECE_SQUARE_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0
]

/**
 * Generally encourage the queen to be centralized, where it can be
 * the most active.
 */
const WHITE_QUEEN_PIECE_SQUARE_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  5,  0,-10,
  -10,  0,  5,  5,  5,  5,  5,-10,
   -5,  0,  5,  5,  5,  5,  0,  0,
   -5,  0,  5,  5,  5,  5,  0, -5,
  -10,  0,  5,  5,  5,  5,  0,-10,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
]

const BLACK_QUEEN_PIECE_SQUARE_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
]

/**
 * Encourage king to castle and be behind the pawns
 */
const WHITE_KING_PIECE_SQUARE_TABLE = [
   20, 30, 10,  0,  0, 10, 30, 20,
   20, 20,  0,  0,  0,  0, 20, 20,
  -10,-20,-20,-20,-20,-20,-20,-10,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
]

const BLACK_KING_PIECE_SQUARE_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
]

/**
 * All Piece Square Tables
 */
export const PIECE_SQUARE_TABLES = [
  WHITE_PAWN_PIECE_SQUARE_TABLE,
  WHITE_KNIGHT_PIECE_SQUARE_TABLE,
  WHITE_BISHOP_PIECE_SQUARE_TABLE,
  WHITE_ROOK_PIECE_SQUARE_TABLE,
  WHITE_QUEEN_PIECE_SQUARE_TABLE,
  WHITE_KING_PIECE_SQUARE_TABLE,
  BLACK_PAWN_PIECE_SQUARE_TABLE,
  BLACK_KNIGHT_PIECE_SQUARE_TABLE,
  BLACK_BISHOP_PIECE_SQUARE_TABLE,
  BLACK_ROOK_PIECE_SQUARE_TABLE,
  BLACK_QUEEN_PIECE_SQUARE_TABLE,
  BLACK_KING_PIECE_SQUARE_TABLE,
]