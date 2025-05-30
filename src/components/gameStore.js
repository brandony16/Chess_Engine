import { create } from "zustand";
import {
  BLACK,
  BLACK_PAWN,
  INITIAL_BITBOARDS,
  WHITE,
  WHITE_PAWN,
} from "./bitboardUtils/constants";
import { updateCastlingRights } from "./bitboardUtils/moveMaking/castleMoveLogic";
import { getNewEnPassant } from "./bitboardUtils/bbChessLogic";
import { computeAllAttackMasks } from "./bitboardUtils/PieceMasks/individualAttackMasks";
import { initializePieceAtArray } from "./bitboardUtils/pieceGetters";
import { initializePieceIndicies } from "./bitboardUtils/pieceIndicies";

export const useGameStore = create((set) => ({
  // STATE
  bitboards: INITIAL_BITBOARDS.slice(),
  selectedSquare: null,
  moveBitboard: null,
  currPlayer: WHITE,
  userSide: WHITE,
  enPassantSquare: null,
  promotion: false,
  promotionMove: null,
  isGameOver: false,
  result: null,
  pastPositions: new Map(),
  pastMoves: [],
  pastBitboards: [],
  displayedBitboards: INITIAL_BITBOARDS.slice(),
  isCurrPositionShown: true,
  currIndexOfDisplayed: -1,
  castlingRights: [true, true, true, true], // WK, WQ, BK, BQ
  fiftyMoveRuleCounter: 0,
  gameHistory: [],
  isModalOpen: false,
  isGameHistoryMenuOpen: false,
  isBattleEnginesOpen: false,

  // ACTIONS / UPDATER FUNCTIONS

  updateStates: (moveNotation, move, gameOverObj) => {
    set((state) => {
      let newFiftyRuleNum = state.fiftyMoveRuleCounter + 1;
      const pieceMoved = move.piece;
      if (
        move.captured !== null ||
        pieceMoved === WHITE_PAWN ||
        pieceMoved === BLACK_PAWN
      ) {
        newFiftyRuleNum = 0;
      }

      return {
        isGameOver: gameOverObj.isGameOver,
        result: gameOverObj.result,
        pastMoves: [...state.pastMoves, moveNotation],
        enPassantSquare: getNewEnPassant(move),
        castlingRights: updateCastlingRights(
          move.from,
          move.to,
          state.castlingRights
        ),
        selectedSquare: null,
        moveBitboard: null,
        pastPositions: state.pastPositions,
        pastBitboards: [...state.pastBitboards, state.bitboards.slice()],
        displayedBitboards: state.bitboards.slice(),
        currIndexOfDisplayed: state.currIndexOfDisplayed + 1,
        currPlayer: state.currPlayer === WHITE ? BLACK : WHITE,
        fiftyMoveRuleCounter: newFiftyRuleNum,
        promotion: false,
        promotionMove: null,
      };
    });
  },

  resetGame: (isEngineGame = null) => {
    set((state) => {
      const newHistory = state.isGameOver
        ? [
            ...state.gameHistory,
            {
              moves: state.pastMoves,
              bitboards: state.pastBitboards,
              result: state.result,
              isEngineGame: isEngineGame,
              userSide: state.userSide,
            },
          ]
        : state.gameHistory;
      initializePieceIndicies(INITIAL_BITBOARDS);
      computeAllAttackMasks(INITIAL_BITBOARDS);
      initializePieceAtArray(INITIAL_BITBOARDS);

      return {
        bitboards: INITIAL_BITBOARDS.slice(),
        selectedSquare: null,
        moveBitboard: null,
        currPlayer: WHITE,
        userSide: state.userSide === WHITE ? BLACK : WHITE,
        enPassantSquare: null,
        promotion: false,
        promotionMove: null,
        isGameOver: false,
        result: null,
        pastPositions: new Map(),
        pastMoves: [],
        pastBitboards: [],
        displayedBitboards: INITIAL_BITBOARDS.slice(),
        isCurrPositionShown: true,
        currIndexOfDisplayed: -1,
        gameHistory: newHistory,
        castlingRights: [true, true, true, true], // WK, WQ, BK, BQ
        fiftyMoveRuleCounter: 0,
        isModalOpen: false,
        isGameHistoryMenuOpen: false,
        isBattleEnginesOpen: false,
      };
    });
  },

  updateShownGame: (game) => {
    const lastBitboards = game.bitboards[game.bitboards.length - 1];
    set(() => ({
      pastMoves: game.moves,
      pastBitboards: game.bitboards,
      bitboards: lastBitboards,
      result: game.result,
      displayedBitboards: lastBitboards,
      isCurrPositionShown: false,
      currIndexOfDisplayed: game.bitboards.length - 1,
    }));
  },

  goToMove: (moveNumber, moveID) => {
    set((state) => {
      let index = moveNumber * 2 + moveID;
      return {
        displayedBitboards: state.pastBitboards[index],
        isCurrPositionShown: false,
        currIndexOfDisplayed: index,
      };
    });
  },

  openGameHistory: () => {
    set(() => ({
      isModalOpen: true,
      isGameHistoryMenuOpen: true,
      isBattleEnginesOpen: false,
    }));
  },

  openBattleMenu: () => {
    set(() => ({
      isModalOpen: true,
      isGameHistoryMenuOpen: false,
      isBattleEnginesOpen: true,
    }));
  },

  closeModal: () => {
    set(() => ({
      isModalOpen: false,
      isGameHistoryMenuOpen: false,
      isBattleEnginesOpen: false,
    }));
  },
}));
