import { NO_PIECE, type Piece, type Square } from "../game/chessConstants.ts";
import { moveFrom, movePromotion, moveTo } from "../game/moveMaking/move.ts";
import { game, type GameStoreState } from "./gameStore.ts";

export const getShownMove = (state: GameStoreState) =>
  state.pastPositions[state.idxOfDisplayedMove];

export const isCurrPosShown = (state: GameStoreState) =>
  state.idxOfDisplayedMove === state.pastPositions.length - 1;

export const findMove = (
  state: GameStoreState,
  from: Square,
  to: Square,
  promoPiece: Piece = NO_PIECE,
) => {
  const move = state.legalMovesForSelected.find(
    (elem) =>
      moveFrom(elem) === from &&
      moveTo(elem) === to &&
      movePromotion(elem) === promoPiece,
  );
  if (!move) {
    throw new Error(`Move not found: from ${from}, to ${to}`);
  }

  return move;
};

export const isGameOver = (state: GameStoreState) => {
  return game.isOver() || state.userResigned || state.isTimeOut;
};
