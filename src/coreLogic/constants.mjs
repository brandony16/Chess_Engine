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

// Basic Piece Weights based off of literal material values
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

// Array of directions
export const DIRECTIONS = [
  { df: 1, dr: 0 }, // east
  { df: -1, dr: 0 }, // west
  { df: 0, dr: 1 }, // north
  { df: 0, dr: -1 }, // south
  { df: 1, dr: 1 }, // northeast
  { df: -1, dr: 1 }, // northwest
  { df: 1, dr: -1 }, // southeast
  { df: -1, dr: -1 }, // southwest
];
