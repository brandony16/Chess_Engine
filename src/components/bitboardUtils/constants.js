// Inital bitboards
export const INITIAL_BITBOARDS = {
  whitePawns: BigInt("0x000000000000FF00"),
  whiteKnights: BigInt("0x0000000000000042"),
  whiteBishops: BigInt("0x0000000000000024"),
  whiteRooks: BigInt("0x0000000000000081"),
  whiteQueens: BigInt("0x0000000000000008"),
  whiteKings: BigInt("0x0000000000000010"),
  blackPawns: BigInt("0x00FF000000000000"),
  blackKnights: BigInt("0x4200000000000000"),
  blackBishops: BigInt("0x2400000000000000"),
  blackRooks: BigInt("0x8100000000000000"),
  blackQueens: BigInt("0x0800000000000000"),
  blackKings: BigInt("0x1000000000000000"),
};

// MASKS
export const FILE_H_MASK = 0x7f7f7f7f7f7f7f7fn;
export const FILE_A_MASK = 0xfefefefefefefefen;
export const RANK_8_MASK = 0x00ffffffffffffffn;
export const RANK_1_MASK = 0xffffffffffffff00n;

/**
 * Converts the pieces to the correct character. Uppercase is white, lowercase is black.
 */
export const PIECE_SYMBOLS = {
  whitePawns: "P",
  whiteKnights: "N",
  whiteBishops: "B",
  whiteRooks: "R",
  whiteQueens: "Q",
  whiteKings: "K",
  blackPawns: "p",
  blackKnights: "n",
  blackBishops: "b",
  blackRooks: "r",
  blackQueens: "q",
  blackKings: "k",
};

/**
 * Converts the pieces to the correct character independent of player. Uppercase for all
 */
export const GENERAL_SYMBOLS = {
  whitePawns: "P",
  whiteKnights: "N",
  whiteBishops: "B",
  whiteRooks: "R",
  whiteQueens: "Q",
  whiteKings: "K",
  blackPawns: "P",
  blackKnights: "N",
  blackBishops: "B",
  blackRooks: "R",
  blackQueens: "Q",
  blackKings: "K",
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
