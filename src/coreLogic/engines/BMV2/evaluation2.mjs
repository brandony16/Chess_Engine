import { CHECKMATE_VALUE, WEIGHTS, WHITE } from "../../constants.mjs";
import { pieceAt } from "../../pieceGetters.mjs";
import { getAllIndicies } from "../../pieceIndicies.mjs";

/**
 * Gets the evaluation of the given position based purely off of the material in the position.
 * @param {number} player - the opposite player. If black plays checkmate, this is white.
 * @param {string} result - the game over result of the position. Null if game is not over
 * @returns {number} The evaluation
 */
export const evaluate2 = (player, result, depth) => {
  // Needs to be a big number but not infinity because then it wont update the move
  if (result) {
    if (result.includes("Checkmate")) {
      return -CHECKMATE_VALUE + depth;
    }
    return 0; // Draw
  }

  let evaluation = 0;

  const allIndicies = getAllIndicies();
  for (const square of allIndicies) {
    const piece = pieceAt[square];
    evaluation += WEIGHTS[piece];
  }
  return player === WHITE ? evaluation : -evaluation;
};
