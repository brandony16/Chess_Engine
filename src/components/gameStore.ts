import { create } from "zustand";
import {
  BLACK,
  BLACK_PAWN,
  INITIAL_BITBOARDS,
  WHITE,
  WHITE_PAWN,
} from "../coreLogic/constants.mjs";
import { updateCastlingRights } from "../coreLogic/moveMaking/castleMoveLogic.mjs";
import { getNewEnPassant } from "../game/bbChessLogic.mjs";
import { computeAllAttackMasks } from "../coreLogic/PieceMasks/individualAttackMasks.mjs";
import { initializePieceAtArray } from "../game/pieceUtils/pieceGetters.ts";
import { initializePieceIndicies } from "../game/positionStates/pieceIndexUpdators.ts";
import { EngineTypes, ModalTypes } from "./utilTypes.js";
import type Move from "../game/moveMaking/move.ts";
import { Game } from "./game.ts";

type FEN = string;

interface GameStoreState {
  game: Game;
  userSide: "w" | "b";

  // ----- UI -----
  selectedSquare: number | null;
  legalMovesForSelected: Move[];
  
  isModalOpen: boolean;
  modalType: string | null;
  boardPerspective: "w" | "b";

  // ----- ENGINE INFO -----
  selectedEngine: string;
  searchDepth: number;
  maxSearchTimeMs: number;

  pastPositions: FEN[];
  currIdxOfDisplayed: number;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  game: new Game(),
  userSide: "w",

  // ----- UI -----
  selectedSquare: null,
  legalMovesForSelected: [],
  
  isModalOpen: false,
  modalType: null,
  boardPerspective: "w",

  // ----- ENGINE INFO -----
  selectedEngine: EngineTypes.BMV1,
  searchDepth: 5,
  maxSearchTimeMs: 5000,

  pastPositions: [],
  currIdxOfDisplayed: -1,


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

    resetGame: ({
      isEngineGame = false,
      userSide = null,
      engine = EngineTypes.BMV5,
      engine2 = null,
      depth = 4,
      timeLimitMs = 5000,
    }) => {
      const state = get();
      const historyEntry = state.isGameOver
        ? {
            moves: state.pastMoves,
            bitboards: state.pastBitboards,
            result: state.result,
            isEngineGame: isEngineGame,
            userSide: state.userSide,
          }
        : null;
      if (!Object.values(EngineTypes).includes(engine)) {
        console.warn("Invalid engine passed");
        return;
      }

      const historyArr = historyEntry
        ? [...state.gameHistory, historyEntry]
        : state.gameHistory;

      // re-init globals
      initializePieceIndicies(INITIAL_BITBOARDS);
      computeAllAttackMasks(INITIAL_BITBOARDS);
      initializePieceAtArray(INITIAL_BITBOARDS);

      set(() => ({
        ...makeInitialState(),
        gameHistory: historyArr,
        userSide: userSide,
        selectedEngine: engine,
        engineDepth: depth,
        engineTimeLimitMs: timeLimitMs,
        boardViewSide: userSide,
      }));
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
        const isCurrPos = index === state.pastBitboards.length - 1;
        return {
          displayedBitboards: isCurrPos
            ? state.bitboards.slice()
            : state.pastBitboards[index],
          isCurrPositionShown: isCurrPos,
          currIndexOfDisplayed: index,
        };
      });
    },

    openModal(type) {
      if (!Object.values(ModalTypes).includes(type)) {
        console.warn(`Invalid modal type: ${type}`);
        return;
      }
      set(() => ({
        isModalOpen: true,
        modalType: type,
      }));
    },

    closeModal: () => {
      set(() => ({
        isModalOpen: false,
        modalType: ModalTypes.NONE,
      }));
    },

    flipBoardView: () => {
      set((state) => ({
        boardViewSide: state.boardViewSide === WHITE ? BLACK : WHITE,
      }));
    },

    changeViewedMove: (direction) => {
      const state = get();
      const index = state.currIndexOfDisplayed + direction;

      if (index < 0 || index >= state.pastBitboards.length) return;

      set((state) => ({
        displayedBitboards: state.pastBitboards[index],
        currIndexOfDisplayed: state.currIndexOfDisplayed + direction,
      }));

      if (index === state.pastBitboards.length - 1) {
        set(() => ({ isCurrPositionShown: true }));
      } else {
        set(() => ({
          isCurrPositionShown: false,
          selectedSquare: null,
          moveBitboard: null,
        }));
      }
    },

    addHistoryEntry: (entry) => {
      set((state) => ({
        gameHistory: [...state.gameHistory, entry],
      }));
    };
}));
