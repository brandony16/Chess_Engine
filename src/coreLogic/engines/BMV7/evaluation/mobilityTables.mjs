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
import { blendWithPhase } from "./phase";

// Knight has at most 8 moves
const KNIGHT_MOBILITY = [
  [-75, -76],
  [-56, -54],
  [-9, -26],
  [-2, -10],
  [6, 5],
  [15, 11],
  [22, 26],
  [30, 28],
  [36, 29],
];

// Bishop has at most 13 moves
const BISHOP_MOBILITY = [
  [-48, -58],
  [-21, -19],
  [16, -2],
  [26, 12],
  [37, 22],
  [51, 42],
  [54, 54],
  [63, 58],
  [65, 63],
  [71, 70],
  [79, 74],
  [81, 86],
  [92, 90],
  [97, 94],
];

// Rook has at most 14 moves
const ROOK_MOBILITY = [
  [-56, -78],
  [-25, -18],
  [-11, 26],
  [-5, 55],
  [-4, 70],
  [-1, 81],
  [8, 109],
  [14, 120],
  [21, 128],
  [23, 143],
  [31, 154],
  [32, 160],
  [43, 165],
  [49, 168],
  [59, 169],
];

// Queen has at most 27 moves (rook + bishop)
const QUEEN_MOBILITY = [
  [-40, -35],
  [-25, -12],
  [2, 7],
  [4, 19],
  [14, 37],
  [24, 55],
  [25, 62],
  [40, 76],
  [43, 79],
  [47, 87],
  [54, 94],
  [56, 102],
  [60, 111],
  [70, 116],
  [72, 118],
  [73, 122],
  [75, 128],
  [77, 130],
  [85, 133],
  [94, 136],
  [99, 140],
  [108, 157],
  [112, 158],
  [113, 161],
  [118, 174],
  [119, 177],
  [123, 191],
  [128, 199],
];

export const getMobilityValues = (piece, moves) => {
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

export const getMobility = (piece, moves, phase) => {
  const mobilityValues = getMobilityValues(piece, moves);

  const mgScore = mobilityValues[0];
  const egScore = mobilityValues[1];
  return blendWithPhase(mgScore, egScore, phase);
};
