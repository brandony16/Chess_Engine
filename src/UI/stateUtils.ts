import type { GameStoreState } from "./gameStore.ts";

export const getShownMove = (state: GameStoreState) =>
  state.pastPositions[state.currIdxOfDisplayed];

export const isCurrPosShown = (state: GameStoreState) =>
  state.currIdxOfDisplayed === state.pastPositions.length - 1;
