// Players
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

export type Piece =
  | typeof WHITE_PAWN
  | typeof WHITE_KNIGHT
  | typeof WHITE_BISHOP
  | typeof WHITE_ROOK
  | typeof WHITE_QUEEN
  | typeof WHITE_KING
  | typeof BLACK_PAWN
  | typeof BLACK_KNIGHT
  | typeof BLACK_BISHOP
  | typeof BLACK_ROOK
  | typeof BLACK_QUEEN
  | typeof BLACK_KING;
export const NO_PIECE = -1 as const;

export type PieceAt = Piece | typeof NO_PIECE;

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

// Promotion pieces
export const WHITE_PROMO_PIECES = [
  WHITE_QUEEN,
  WHITE_ROOK,
  WHITE_BISHOP,
  WHITE_KNIGHT,
] as const;
export const BLACK_PROMO_PIECES = [
  BLACK_QUEEN,
  BLACK_ROOK,
  BLACK_BISHOP,
  BLACK_KNIGHT,
] as const;

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
export const INITIAL_BITBOARDS: BigUint64Array = new BigUint64Array(NUM_PIECES);

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
