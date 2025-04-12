import { create } from "zustand";
import { INITIAL_BITBOARDS } from "./bitboardUtils/constants";
import { updateCastlingRights } from "./bitboardUtils/moveMaking/castleMoveLogic";

export const useGameStore = create((set, get) => ({
  // STATE
  bitboards: INITIAL_BITBOARDS,
  selectedSquare: null,
  moveBitboard: null,
  currPlayer: "w",
  userSide: "w",
  enPassantSquare: null,
  promotion: false,
  promotionMove: null,
  isGameOver: false,
  result: null,
  pastPositions: new Map(),
  pastMoves: [],
  pastBitboards: [],
  displayedBitboards: INITIAL_BITBOARDS,
  isCurrPositionShown: true,
  currIndexOfDisplayed: -1,
  castlingRights: {
    whiteKingside: true,
    whiteQueenside: true,
    blackKingside: true,
    blackQueenside: true,
  },

  // ACTIONS / UPDATER FUNCTIONS

  updateStates: (moveNotation, moveObj, newBitboards, hash, gameOverObj, from) => {
    set((state) => ({
      isGameOver: gameOverObj.isGameOver,
      result: gameOverObj.result,
      pastMoves: [...state.pastMoves, moveNotation],
      enPassantSquare: moveObj.enPassantSquare,
      castlingRights: updateCastlingRights(
        from,
        state.castlingRights
      ),
      selectedSquare: null,
      bitboards: newBitboards,
      moveBitboard: null,
      pastPositions: (() => {
        const newPositions = new Map(state.pastPositions);
        newPositions.set(hash, (newPositions.get(hash) || 0) + 1);
        return newPositions;
      })(),
      pastBitboards: [...state.pastBitboards, newBitboards],
      displayedBitboards: newBitboards,
      currIndexOfDisplayed: state.currIndexOfDisplayed + 1,
      currPlayer: state.currPlayer === "w" ? "b" : "w",
    }));
  },

  resetGame: () =>
    set((state) => ({
      bitboards: INITIAL_BITBOARDS,
      selectedSquare: null,
      moveBitboard: null,
      currPlayer: "w",
      userSide: state.userSide === "w" ? "b" : "w",
      enPassantSquare: null,
      promotion: false,
      promotionMove: null,
      isGameOver: false,
      result: null,
      pastPositions: new Map(),
      pastMoves: [],
      pastBitboards: [],
      displayedBitboards: INITIAL_BITBOARDS,
      isCurrPositionShown: true,
      currIndexOfDisplayed: -1,
      castlingRights: {
        whiteKingside: true,
        whiteQueenside: true,
        blackKingside: true,
        blackQueenside: true,
      },
    })),
}));
