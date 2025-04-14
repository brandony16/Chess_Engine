import { create } from "zustand";
import { INITIAL_BITBOARDS } from "./bitboardUtils/constants";
import { updateCastlingRights } from "./bitboardUtils/moveMaking/castleMoveLogic";
import { clearAttackMaskCache } from "./bitboardUtils/PieceMasks/attackMask";
import { getPieceAtSquare } from "./bitboardUtils/pieceGetters";

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
  fiftyMoveRuleCounter: 0,

  gameHistory: [],
  isGameHistoryMenuOpen: false,

  // ACTIONS / UPDATER FUNCTIONS

  updateStates: (
    moveNotation,
    moveObj,
    newBitboards,
    hash,
    gameOverObj,
    from
  ) => {
    set((state) => {
      let newFiftyRuleNum = state.fiftyMoveRuleCounter + 1;
      const pieceMoved = getPieceAtSquare(from, state.bitboards);
      if (moveObj.isCapture || pieceMoved.charAt(5) === "P") {
        newFiftyRuleNum = 0;
      }

      return {
        isGameOver: gameOverObj.isGameOver,
        result: gameOverObj.result,
        pastMoves: [...state.pastMoves, moveNotation],
        enPassantSquare: moveObj.enPassantSquare,
        castlingRights: updateCastlingRights(from, state.castlingRights),
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
        fiftyMoveRuleCounter: newFiftyRuleNum,
      };
    });
  },

  resetGame: () => {
    clearAttackMaskCache();

    set((state) => {
      const newHistory = state.isGameOver
        ? [
            ...state.gameHistory,
            {
              moves: state.pastMoves,
              bitboards: state.pastBitboards,
              result: state.result,
            },
          ]
        : state.gameHistory;

      return {
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
        gameHistory: newHistory,
        castlingRights: {
          whiteKingside: true,
          whiteQueenside: true,
          blackKingside: true,
          blackQueenside: true,
        },
        fiftyMoveRuleCounter: 0,
        isGameHistoryMenuOpen: false,
      };
    });
  },

  updateShownGame: (game) => {
    set((state) => ({
      pastMoves: game.moves,
      bitboards: game.bitboards,
      result: game.result,
    }));
  },
}));
