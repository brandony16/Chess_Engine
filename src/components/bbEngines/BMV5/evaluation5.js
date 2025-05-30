import { bitScanForward } from "../../bitboardUtils/bbUtils";
import {
  CHECKMATE_VALUE,
  NUM_PIECES,
  WHITE,
} from "../../bitboardUtils/constants";
import { PIECE_SQUARE_TABLES } from "./PieceSquareTables";

/**
 * Gets the evaluation of the given position based purely off of the material in the position.
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {number} player - the opposite player. If black plays checkmate, this is white.
 * @param {string} result - the game over result of the position. Null if game is not over
 * @returns {number} The evaluation
 */
export const evaluate5 = (bitboards, player, result, depth) => {
  // Needs to be a big number but not infinity because then it wont update the move
  if (result) {
    if (result.includes("Checkmate")) {
      return player === WHITE
        ? -CHECKMATE_VALUE + depth
        : CHECKMATE_VALUE - depth;
    }
    return 0; // Draw
  }

  let evaluation = 0;

  for (let piece = 0; piece < NUM_PIECES; piece++) {
    let bb = bitboards[piece];
    while (bb) {
      const sq = bitScanForward(bb);
      bb &= bb - 1n;

      evaluation += weights[piece] + PIECE_SQUARE_TABLES[piece][sq];
    }
  }

  return evaluation;
};

// Weights from Chess Programming Wiki Simplified Evaluation Function Page.
// https://www.chessprogramming.org/Simplified_Evaluation_Function
export const weights = [
  100, 320, 330, 500, 900, 20_000, -100, -320, -330, -500, -900, -20_000,
];
