import { BLACK, CHECKMATE_VALUE, WHITE } from "../../../constants.mjs";
import { pieceAt } from "../../../pieceGetters.mjs";
import { getAllIndicies } from "../../../pieceIndicies.mjs";
import { calculateMobility } from "./mobility.mjs";
import { PIECE_SQUARE_TABLES } from "./PieceSquareTables.mjs";

/**
 * Gets the evaluation of the given position relative to the passed player.
 * Positive if winning, negative if losing.
 *
 * V6: Adds mobility
 *
 * @param {number} player - the opposite player. If black plays checkmate, this is white.
 * @param {string} result - the game over result of the position. Null if game is not over
 * @returns {number} The evaluation
 */
export const evaluate6 = (bitboards, player, result, depth) => {
  // Needs to be a big number but not infinity because then it wont update the move
  if (result) {
    if (result.includes("Checkmate")) {
      return -CHECKMATE_VALUE + depth;
    }
    return 0; // Draw
  }

  // Build evaluation relative to white
  let evaluation = 0;

  const allIndicies = getAllIndicies();
  for (const square of allIndicies) {
    const piece = pieceAt[square];
    const playerMultiplier = piece < 6 ? 1 : -1;

    evaluation +=
      playerMultiplier *
      (weights[piece % 6] + PIECE_SQUARE_TABLES[piece][square]);
  }

  const whiteMobility = calculateMobility(bitboards, WHITE);
  const blackMobility = calculateMobility(bitboards, BLACK);
  const mobilityDiff = whiteMobility - blackMobility;

  evaluation += mobilityDiff;

  // Eval relative to player passed in
  return player === WHITE ? evaluation : -evaluation;
};

// Weights from Chess Programming Wiki Simplified Evaluation Function Page.
// https://www.chessprogramming.org/Simplified_Evaluation_Function
export const weights = [100, 320, 330, 500, 900, 20_000];
