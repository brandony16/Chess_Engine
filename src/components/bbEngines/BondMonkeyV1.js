import { allLegalMovesArr } from "../bitboardUtils/bbHelpers";

// V1: Plays a random legal move
export const getBestMove = (bitboards, player, castlingRights, enPassantSquare) => {
  const moves = allLegalMovesArr(bitboards, player, castlingRights, enPassantSquare);

  return moves[Math.floor(Math.random() * moves.length)];
};
