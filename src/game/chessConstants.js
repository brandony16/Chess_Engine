// Players
export const WHITE = 0;
export const BLACK = 1;

// ----- PIECES -----
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
