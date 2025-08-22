/*
 * These values are gotten from stockfish v8.
 * https://www.reddit.com/r/chess/comments/5s6xxn/so_heres_how_stockfish_8_calculates_mobility_area
 *
 * { S(-75,-76), S(-56,-54), S( -9,-26), S( -2,-10), S(  6,  5), S( 15, 11), // Knights
 *    S( 22, 26), S( 30, 28), S( 36, 29) },
 *
 * { S(-48,-58), S(-21,-19), S( 16, -2), S( 26, 12), S( 37, 22), S( 51, 42), // Bishops
 *   S( 54, 54), S( 63, 58), S( 65, 63), S( 71, 70), S( 79, 74), S( 81, 86),
 *   S( 92, 90), S( 97, 94) },
 *
 * { S(-56,-78), S(-25,-18), S(-11, 26), S( -5, 55), S( -4, 70), S( -1, 81), // Rooks
 *   S(  8,109), S( 14,120), S( 21,128), S( 23,143), S( 31,154), S( 32,160),
 *   S( 43,165), S( 49,168), S( 59,169) },
 *
 * { S(-40,-35), S(-25,-12), S(  2,  7), S(  4, 19), S( 14, 37), S( 24, 55), // Queens
 *   S( 25, 62), S( 40, 76), S( 43, 79), S( 47, 87), S( 54, 94), S( 56,102),
 *   S( 60,111), S( 70,116), S( 72,118), S( 73,122), S( 75,128), S( 77,130),
 *   S( 85,133), S( 94,136), S( 99,140), S(108,157), S(112,158), S(113,161),
 *   S(118,174), S(119,177), S(123,191), S(128,199) }
 *  };
 */

import {
  isBishop,
  isKing,
  isKnight,
  isPawn,
  isQueen,
  isRook,
} from "../../../helpers/pieceUtils";

// Knight has at most 8 moves
const KNIGHT_MOBILITY = [-75, -56, -9, -2, 6, 15, 22, 30, 36];

// Bishop has at most 13 moves
const BISHOP_MOBILITY = [
  -48, -21, 16, 26, 37, 51, 54, 63, 65, 71, 79, 81, 92, 97,
];

// Rook has at most 14 moves
const ROOK_MOBILITY = [
  -56, -25, -11, -5, -4, -1, 8, 14, 21, 23, 31, 32, 43, 49, 59,
];

// Queen has at most 27 moves (rook + bishop)
const QUEEN_MOBILITY = [
  -40, -25, 2, 4, 14, 24, 25, 40, 43, 47, 54, 56, 60, 70, 72, 73, 75, 77, 86,
  94, 99, 108, 112, 113, 118, 119, 123, 128,
];

export const getMobility = (piece, moves) => {
  switch (true) {
    case isKnight(piece):
      return KNIGHT_MOBILITY[moves];
    case isBishop(piece):
      return BISHOP_MOBILITY[moves];
    case isRook(piece):
      return ROOK_MOBILITY[moves];
    case isQueen(piece):
      return QUEEN_MOBILITY[moves];
    case isPawn(piece) || isKing(piece):
      return 0;
    default:
      throw new Error("Invalid piece: ", piece);
  }
};
