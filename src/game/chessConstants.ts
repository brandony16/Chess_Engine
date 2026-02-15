// Players
export type Player = 0 | 1; // WHITE = 0, BLACK = 1
export const WHITE = 0 as const;
export const BLACK = 1 as const;

// ----- PIECES -----
export const NUM_PIECES = 12 as const;

export const WHITE_PAWN = 0 as const;
export const WHITE_KNIGHT = 1 as const;
export const WHITE_BISHOP = 2 as const;
export const WHITE_ROOK = 3 as const;
export const WHITE_QUEEN = 4 as const;
export const WHITE_KING = 5 as const;
export const BLACK_PAWN = 6 as const;
export const BLACK_KNIGHT = 7 as const;
export const BLACK_BISHOP = 8 as const;
export const BLACK_ROOK = 9 as const;
export const BLACK_QUEEN = 10 as const;
export const BLACK_KING = 11 as const;

export const NO_PIECE = -1 as const;
export type Piece = (typeof PIECES)[number] | typeof NO_PIECE;

export const PIECE = {
  wP: WHITE_PAWN,
  wN: WHITE_KNIGHT,
  wB: WHITE_BISHOP,
  wR: WHITE_ROOK,
  wQ: WHITE_QUEEN,
  wK: WHITE_KING,
  bP: BLACK_PAWN,
  bN: BLACK_KNIGHT,
  bB: BLACK_BISHOP,
  bR: BLACK_ROOK,
  bQ: BLACK_QUEEN,
  bK: BLACK_KING,
} as const;

const WHITE_PIECES = [
  WHITE_PAWN,
  WHITE_KNIGHT,
  WHITE_BISHOP,
  WHITE_ROOK,
  WHITE_QUEEN,
  WHITE_KING,
];

const BLACK_PIECES = [
  BLACK_PAWN,
  BLACK_KNIGHT,
  BLACK_BISHOP,
  BLACK_ROOK,
  BLACK_QUEEN,
  BLACK_KING,
];

export const PLAYER_PIECES = [WHITE_PIECES, BLACK_PIECES] as const;

export const PIECES = [
  WHITE_PAWN,
  WHITE_KNIGHT,
  WHITE_BISHOP,
  WHITE_ROOK,
  WHITE_QUEEN,
  WHITE_KING,
  BLACK_PAWN,
  BLACK_KNIGHT,
  BLACK_BISHOP,
  BLACK_ROOK,
  BLACK_QUEEN,
  BLACK_KING,
] as const;

export const SLIDING_PIECES = [
  WHITE_BISHOP,
  WHITE_ROOK,
  WHITE_QUEEN,
  BLACK_BISHOP,
  BLACK_ROOK,
  BLACK_QUEEN,
] as const;

// Promotion pieces
const WHITE_PROMO_PIECES = [
  WHITE_QUEEN,
  WHITE_ROOK,
  WHITE_BISHOP,
  WHITE_KNIGHT,
] as const;
const BLACK_PROMO_PIECES = [
  BLACK_QUEEN,
  BLACK_ROOK,
  BLACK_BISHOP,
  BLACK_KNIGHT,
] as const;

export const PROMO_PIECES = [WHITE_PROMO_PIECES, BLACK_PROMO_PIECES] as const;

// Piece to String and vice versa
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

// ----- CASTLING CONSTANTS -----
export const W_KINGSIDE_EMPTY: bigint = (1n << 5n) | (1n << 6n); // f1, g1
export const W_QUEENSIDE_EMPTY: bigint = (1n << 1n) | (1n << 2n) | (1n << 3n); // b1, c1, d1
export const B_KINGSIDE_EMPTY: bigint = (1n << 61n) | (1n << 62n); // f8, g8
export const B_QUEENSIDE_EMPTY: bigint =
  (1n << 57n) | (1n << 58n) | (1n << 59n); // b8, c8, d8

export const W_KINGSIDE_SAFE: bigint = (1n << 4n) | (1n << 5n) | (1n << 6n); // e1, f1, g1
export const W_QUEENSIDE_SAFE: bigint = (1n << 4n) | (1n << 3n) | (1n << 2n); // e1, d1, c1
export const B_KINGSIDE_SAFE: bigint = (1n << 60n) | (1n << 61n) | (1n << 62n); // e8, f8, g8
export const B_QUEENSIDE_SAFE: bigint = (1n << 60n) | (1n << 59n) | (1n << 58n); // e8, d8, c8

export const WK = 1 << 0; // white kingside
export const WQ = 1 << 1; // white queenside
export const BK = 1 << 2; // black kingside
export const BQ = 1 << 3; // black queenside

export const ALL_CASTLING = WK | WQ | BK | BQ;

// ----- BITBOARDS -----
export type Bitboard = bigint;
export const INITIAL_BITBOARDS: BigUint64Array = new BigUint64Array(NUM_PIECES);

// white
INITIAL_BITBOARDS[PIECE.wP] = 0x000000000000ff00n;
INITIAL_BITBOARDS[PIECE.wN] = 0x0000000000000042n;
INITIAL_BITBOARDS[PIECE.wB] = 0x0000000000000024n;
INITIAL_BITBOARDS[PIECE.wR] = 0x0000000000000081n;
INITIAL_BITBOARDS[PIECE.wQ] = 0x0000000000000008n;
INITIAL_BITBOARDS[PIECE.wK] = 0x0000000000000010n;

// black
INITIAL_BITBOARDS[PIECE.bP] = 0x00ff000000000000n;
INITIAL_BITBOARDS[PIECE.bN] = 0x4200000000000000n;
INITIAL_BITBOARDS[PIECE.bB] = 0x2400000000000000n;
INITIAL_BITBOARDS[PIECE.bR] = 0x8100000000000000n;
INITIAL_BITBOARDS[PIECE.bQ] = 0x0800000000000000n;
INITIAL_BITBOARDS[PIECE.bK] = 0x1000000000000000n;

// ----- SQUARES -----
export type Square = number; // 0–63
export const sq = {
  A1: 0,
  B1: 1,
  C1: 2,
  D1: 3,
  E1: 4,
  F1: 5,
  G1: 6,
  H1: 7,
  A2: 8,
  B2: 9,
  C2: 10,
  D2: 11,
  E2: 12,
  F2: 13,
  G2: 14,
  H2: 15,
  A3: 16,
  B3: 17,
  C3: 18,
  D3: 19,
  E3: 20,
  F3: 21,
  G3: 22,
  H3: 23,
  A4: 24,
  B4: 25,
  C4: 26,
  D4: 27,
  E4: 28,
  F4: 29,
  G4: 30,
  H4: 31,
  A5: 32,
  B5: 33,
  C5: 34,
  D5: 35,
  E5: 36,
  F5: 37,
  G5: 38,
  H5: 39,
  A6: 40,
  B6: 41,
  C6: 42,
  D6: 43,
  E6: 44,
  F6: 45,
  G6: 46,
  H6: 47,
  A7: 48,
  B7: 49,
  C7: 50,
  D7: 51,
  E7: 52,
  F7: 53,
  G7: 54,
  H7: 55,
  A8: 56,
  B8: 57,
  C8: 58,
  D8: 59,
  E8: 60,
  F8: 61,
  G8: 62,
  H8: 63,
};

// ----- FILES / RANKS -----
export type File = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const A_FILE = 0;
export const B_FILE = 1;
export const C_FILE = 2;
export const D_FILE = 3;
export const E_FILE = 4;
export const F_FILE = 5;
export const G_FILE = 6;
export const H_FILE = 7;

export const FILES = [
  A_FILE,
  B_FILE,
  C_FILE,
  D_FILE,
  E_FILE,
  F_FILE,
  G_FILE,
  H_FILE,
];

export type Rank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const RANK_1 = 0;
export const RANK_2 = 1;
export const RANK_3 = 2;
export const RANK_4 = 3;
export const RANK_5 = 4;
export const RANK_6 = 5;
export const RANK_7 = 6;
export const RANK_8 = 7;

export const RANKS = [
  RANK_1,
  RANK_2,
  RANK_3,
  RANK_4,
  RANK_5,
  RANK_6,
  RANK_7,
  RANK_8,
];

export const NO_SQUARE = -1;

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

// ----- MASKS -----
export const FILE_H_MASK = 0x7f7f7f7f7f7f7f7fn;
export const FILE_A_MASK = 0xfefefefefefefefen;
export const RANK_8_MASK = 0x00ffffffffffffffn;
export const RANK_1_MASK = 0xffffffffffffff00n;

export const WP_START_ROW = 0x000000000000ff00n;
export const BP_START_ROW = 0x00ff000000000000n;

// ----- GAME END -----
export type Result = -1 | 0 | 1 | 2;

export const IN_PROGRESS = -1;
export const WHITE_WIN = 0;
export const BLACK_WIN = 1;
export const DRAW = 2;

export type EndState = -1 | 0 | 1 | 2 | 3 | 4;
export const CHECKMATE = 0;
export const STALEMATE = 1;
export const REPETITION = 2;
export const INSUFFICIENT_MATERIAL = 3;
export const FIFTY_MOVE_RULE = 4;
