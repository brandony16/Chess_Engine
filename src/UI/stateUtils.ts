import { NO_PIECE, type Piece, type Square } from "../game/chessConstants.ts";
import type { GameStoreState } from "./gameStore.ts";

export const getShownMove = (state: GameStoreState) =>
  state.pastPositions[state.currIdxOfDisplayed];

export const isCurrPosShown = (state: GameStoreState) =>
  state.currIdxOfDisplayed === state.pastPositions.length - 1;

export const findMove = (
  state: GameStoreState,
  from: Square,
  to: Square,
  promoPiece: Piece = NO_PIECE,
) => {
  const move = state.legalMovesForSelected.find(
    (elem) =>
      elem.from === from && elem.to === to && elem.promotion === promoPiece,
  );
  if (!move) {
    throw new Error(`Move not found: from ${from}, to ${to}`);
  }

  return move;
};
