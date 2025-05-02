import { create } from "zustand";
import {
  BLACK,
  BLACK_PAWN,
  INITIAL_BITBOARDS,
  WHITE,
  WHITE_PAWN,
} from "./bitboardUtils/constants";
import { updateCastlingRights } from "./bitboardUtils/moveMaking/castleMoveLogic";
import { clearAttackMaskCache } from "./bitboardUtils/PieceMasks/attackMask";
import { getPieceAtSquare } from "./bitboardUtils/pieceGetters";
import { getNewEnPassant } from "./bitboardUtils/bbChessLogic";

export const useGameStore = create((set, get) => ({
  // STATE
  bitboards: INITIAL_BITBOARDS,
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
  displayedBitboards: [...INITIAL_BITBOARDS],
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
  isModalOpen: false,
  isGameHistoryMenuOpen: false,
  isBattleEnginesOpen: false,

  // ACTIONS / UPDATER FUNCTIONS

  updateStates: (
    moveNotation,
    move,
    hash,
    gameOverObj,
    from
  ) => {
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
        castlingRights: updateCastlingRights(from, state.castlingRights),
        selectedSquare: null,
        moveBitboard: null,
        pastPositions: (() => {
          const newPositions = new Map(state.pastPositions);
          newPositions.set(hash, (newPositions.get(hash) || 0) + 1);
          return newPositions;
        })(),
        pastBitboards: [...state.pastBitboards, [...state.bitboards]],
        displayedBitboards: [...state.bitboards],
        currIndexOfDisplayed: state.currIndexOfDisplayed + 1,
        currPlayer: state.currPlayer === WHITE ? BLACK : WHITE,
        fiftyMoveRuleCounter: newFiftyRuleNum,
      };
    });
  },

  resetGame: (isEngineGame = null) => {
    clearAttackMaskCache();

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

      return {
        bitboards: INITIAL_BITBOARDS,
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
        displayedBitboards: [...INITIAL_BITBOARDS],
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
