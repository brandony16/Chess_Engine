import { CHECKMATE_VALUE, WHITE } from "../../../Core Logic/constants.mjs";
import { pieceAt } from "../../../Core Logic/pieceGetters.mjs";
import { getAllIndicies } from "../../../Core Logic/pieceIndicies.mjs";
import { PIECE_SQUARE_TABLES } from "./PieceSquareTables.mjs";

/**
 * Gets the evaluation of the given position.
 * V5: Adds piece sqaure tables (PSQT) for improved evaluation and positioning.
 * 
 * @param {number} player - the opposite player. If black plays checkmate, this is white.
 * @param {string} result - the game over result of the position. Null if game is not over
 * @returns {number} The evaluation
 */
export const evaluate5 = (player, result, depth) => {
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
    const playerMultiplier = piece < 6 ? 1 : -1;

    evaluation +=
      playerMultiplier *
      (weights[piece % 6] + PIECE_SQUARE_TABLES[piece][square]);
  }

  return player === WHITE ? evaluation : -evaluation;
};

// Weights from Chess Programming Wiki Simplified Evaluation Function Page.
// https://www.chessprogramming.org/Simplified_Evaluation_Function
export const weights = [100, 320, 330, 500, 900, 20_000];
