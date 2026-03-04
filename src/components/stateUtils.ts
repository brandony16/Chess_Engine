import type { GameStoreState } from "./gameStore.ts";

export const selectShownMove = (state: GameStoreState) =>
  state.pastPositions[state.currIdxOfDisplayed];

export const selectIsCurrPosShown = (state: GameStoreState) =>
  state.currIdxOfDisplayed === state.pastPositions.length - 1;
