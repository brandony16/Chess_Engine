export const WHITE = 0;
export const BLACK = 1;

export const PIECE = {
  wP: 0,
  wN: 1,
  wB: 2,
  wR: 3,
  wQ: 4,
  wK: 5,
  bP: 6,
  bN: 7,
  bB: 8,
  bR: 9,
  bQ: 10,
  bK: 11,
};
export const NUM_PIECES = 12;

export const WHITE_PAWN = 0;
export const WHITE_KNIGHT = 1;
export const WHITE_BISHOP = 2;
export const WHITE_ROOK = 3;
export const WHITE_QUEEN = 4;
export const WHITE_KING = 5;
export const BLACK_PAWN = 6;
export const BLACK_KNIGHT = 7;
export const BLACK_BISHOP = 8;
export const BLACK_ROOK = 9;
export const BLACK_QUEEN = 10;
export const BLACK_KING = 11;

// Inital bitboards
export const INITIAL_BITBOARDS = new BigUint64Array(NUM_PIECES);

// white
INITIAL_BITBOARDS[PIECE.wP] = BigInt("0x000000000000FF00");
INITIAL_BITBOARDS[PIECE.wN] = BigInt("0x0000000000000042");
INITIAL_BITBOARDS[PIECE.wB] = BigInt("0x0000000000000024");
INITIAL_BITBOARDS[PIECE.wR] = BigInt("0x0000000000000081");
INITIAL_BITBOARDS[PIECE.wQ] = BigInt("0x0000000000000008");
INITIAL_BITBOARDS[PIECE.wK] = BigInt("0x0000000000000010");

// black
INITIAL_BITBOARDS[PIECE.bP] = BigInt("0x00FF000000000000");
INITIAL_BITBOARDS[PIECE.bN] = BigInt("0x4200000000000000");
INITIAL_BITBOARDS[PIECE.bB] = BigInt("0x2400000000000000");
INITIAL_BITBOARDS[PIECE.bR] = BigInt("0x8100000000000000");
INITIAL_BITBOARDS[PIECE.bQ] = BigInt("0x0800000000000000");
INITIAL_BITBOARDS[PIECE.bK] = BigInt("0x1000000000000000");

// MASKS
export const FILE_H_MASK = 0x7f7f7f7f7f7f7f7fn;
export const FILE_A_MASK = 0xfefefefefefefefen;
export const RANK_8_MASK = 0x00ffffffffffffffn;
export const RANK_1_MASK = 0xffffffffffffff00n;

/**
 * Converts the pieces to the correct character. Uppercase is white, lowercase is black.
 */
export const PIECE_SYMBOLS = {
  0: "P",
  1: "N",
  2: "B",
  3: "R",
  4: "Q",
  5: "K",
  6: "p",
  7: "n",
  8: "b",
  9: "r",
  10: "q",
  11: "k",
};

/**
 * Converts the string pieces to the correct piece index
 */
export const PIECE_INDEXES = {
  P: WHITE_PAWN,
  N: WHITE_KNIGHT,
  B: WHITE_BISHOP,
  R: WHITE_ROOK,
  Q: WHITE_QUEEN,
  K: WHITE_KING,
  p: BLACK_PAWN,
  n: BLACK_KNIGHT,
  b: BLACK_BISHOP,
  r: BLACK_ROOK,
  q: BLACK_QUEEN,
  k: BLACK_KING,
};

/**
 * Converts the pieces to the correct character independent of player. Uppercase for all
 */
export const GENERAL_SYMBOLS = {
  0: "P",
  1: "N",
  2: "B",
  3: "R",
  4: "Q",
  5: "K",
  6: "P",
  7: "N",
  8: "B",
  9: "R",
  10: "Q",
  11: "K",
};

/**
 * Converts columns to their corresponding letter form
 */
export const COLUMN_SYMBOLS = {
  0: "a",
  1: "b",
  2: "c",
  3: "d",
  4: "e",
  5: "f",
  6: "g",
  7: "h",
};

/**
 * Converts letter columns to their corresponding column index
 */
export const COLUMN_INDEXES = {
  a: 0,
  b: 1,
  c: 2,
  d: 3,
  e: 4,
  f: 5,
  g: 6,
  h: 7,
};

// ZOBRIST CONSTANTS
export const CASTLING_ZOBRIST = {
  K: 0xabc123n, // White kingside
  Q: 0xdef456n, // White queenside
  k: 0x789abcn, // Black kingside
  q: 0x123defn, // Black queenside
};

// Random big ints to generate distinct hashes for when it is one players turn and when en passant is legal.
export const PLAYER_ZOBRIST = 0x9d39247e33776d41n;
export const EN_PASSANT_ZOBRIST = 0xf3a9b72c85d614e7n;

// PIece weights
export const WEIGHTS = [1, 3, 3, 5, 9, 1000, -1, -3, -3, -5, -9, -1000];

// Checkmate evaluation constant
export const CHECKMATE_VALUE = 100_000;

// Max search depth
export const MAX_PLY = 32;

// Promotion pieces
export const WHITE_PROMO_PIECES = [
  WHITE_QUEEN,
  WHITE_ROOK,
  WHITE_BISHOP,
  WHITE_KNIGHT,
];
export const BLACK_PROMO_PIECES = [
  BLACK_QUEEN,
  BLACK_ROOK,
  BLACK_BISHOP,
  BLACK_KNIGHT,
];
