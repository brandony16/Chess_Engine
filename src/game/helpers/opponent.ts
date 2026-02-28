import { type Player } from "../chessConstants.ts";

export const opponent = (player: Player): Player => {
  return (player ^ 1) as Player;
};
