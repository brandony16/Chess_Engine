import { getNumPieces } from "../../bitboardUtils/bbUtils.mjs";
import {
  CHECKMATE_VALUE,
  NUM_PIECES,
  WEIGHTS,
  WHITE,
} from "../../bitboardUtils/constants.mjs";

/**
 * Gets the evaluation of the given position based purely off of the material in the position.
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {number} player - the opposite player. If black plays checkmate, this is white.
 * @param {string} result - the game over result of the position. Null if game is not over
 * @returns {number} The evaluation
 */
export const evaluate2 = (bitboards, player, result, depth) => {
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
    evaluation += getNumPieces(bitboards[piece]) * WEIGHTS[piece];
  }
  return evaluation;
};
