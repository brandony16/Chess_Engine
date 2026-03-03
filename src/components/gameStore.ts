import { create } from "zustand";
import { EngineTypes } from "./utilTypes.js";
import type Move from "../game/moveMaking/move.ts";
import { Game } from "./Game.ts";
import { NO_SQUARE, type Square } from "../game/chessConstants.ts";

type FEN = string;
type HistoryEntry = { pgn: string; engineGame: boolean };
type ModalType = "history" | "battle" | "new";
type ModalState = { isOpen: false } | { isOpen: true; type: ModalType };

interface GameStoreState {
  game: Game;
  userSide: "w" | "b";

  // ----- UI -----
  selectedSquare: number | null;
  legalMovesForSelected: Move[];

  modalState: ModalState;
  boardPerspective: "w" | "b";

  // ----- ENGINE INFO -----
  selectedEngine: string;
  searchDepth: number;
  maxSearchTimeMs: number;

  pastPositions: FEN[];
  currIdxOfDisplayed: number;

  pastGames: HistoryEntry[];
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  game: new Game(),
  userSide: "w",

  // ----- UI -----
  selectedSquare: null,
  legalMovesForSelected: [],

  modalState: { isOpen: false },
  boardPerspective: "w",

  // ----- ENGINE INFO -----
  selectedEngine: EngineTypes.BMV1,
  searchDepth: 5,
  maxSearchTimeMs: 5000,

  pastPositions: [],
  currIdxOfDisplayed: -1,

  pastGames: [],

  // ACTIONS / UPDATER FUNCTIONS
  playMove: (move: Move) => {
    const { game, pastPositions } = get();

    const success = game.playMove(move);
    if (!success) return;

    set({
      game,
      selectedSquare: null,
      legalMovesForSelected: [],
      pastPositions: [...pastPositions, game.fen()],
      currIdxOfDisplayed: pastPositions.length - 1,
    });
  },

  selectSquare: (square: Square) => {
    const { game } = get();

    if (square === NO_SQUARE) {
      set({ selectedSquare: null, legalMovesForSelected: [] });
    }

    const moves = game.legalMovesFrom(square);

    set({
      selectedSquare: square,
      legalMovesForSelected: moves,
    });
  },

  resetGame: (fen?: string, isEngineGame: boolean = false) => {
    const { game, pastGames } = get();

    const gamePGN = game.pgn();
    const entry: HistoryEntry = { pgn: gamePGN, engineGame: isEngineGame };

    // only add to history if the game is over
    const updatedPast = game.isOver() ? [...pastGames, entry] : pastGames;

    const newGame = new Game(fen);

    set({
      game: newGame,
      selectedSquare: null,
      legalMovesForSelected: [],
      pastGames: updatedPast,
      pastPositions: [],

      modalState: { isOpen: false },

      currIdxOfDisplayed: -1,
    });
  },

  flipBoard: () => {
    set((state) => ({
      boardPerspective: state.boardPerspective === "w" ? "b" : "w",
    }));
  },

  openModal: (type: Exclude<ModalType, null>) => {
    set({
      modalState: { isOpen: true, type },
    });
  },

  closeModal: () => {
    set({
      modalState: { isOpen: false },
    });
  },


  showNextMove: () => {
    const { pastPositions, currIdxOfDisplayed } = get();

    if (currIdxOfDisplayed === pastPositions.length - 1) {
      return;
    }

    const newIdx = currIdxOfDisplayed + 1;
    // some snapshot of fen at pastPositions[newIdx]
  }

  // goToMove: (moveNumber, moveID) => {
  //   set((state) => {
  //     let index = moveNumber * 2 + moveID;
  //     const isCurrPos = index === state.pastBitboards.length - 1;
  //     return {
  //       displayedBitboards: isCurrPos
  //         ? state.bitboards.slice()
  //         : state.pastBitboards[index],
  //       isCurrPositionShown: isCurrPos,
  //       currIndexOfDisplayed: index,
  //     };
  //   });
  // },

  // openModal(type) {
  //   if (!Object.values(ModalTypes).includes(type)) {
  //     console.warn(`Invalid modal type: ${type}`);
  //     return;
  //   }
  //   set(() => ({
  //     isModalOpen: true,
  //     modalType: type,
  //   }));
  // },

  // closeModal: () => {
  //   set(() => ({
  //     isModalOpen: false,
  //     modalType: ModalTypes.NONE,
  //   }));
  // },

  
  // changeViewedMove: (direction) => {
  //   const state = get();
  //   const index = state.currIndexOfDisplayed + direction;

  //   if (index < 0 || index >= state.pastBitboards.length) return;

  //   set((state) => ({
  //     displayedBitboards: state.pastBitboards[index],
  //     currIndexOfDisplayed: state.currIndexOfDisplayed + direction,
  //   }));

  //   if (index === state.pastBitboards.length - 1) {
  //     set(() => ({ isCurrPositionShown: true }));
  //   } else {
  //     set(() => ({
  //       isCurrPositionShown: false,
  //       selectedSquare: null,
  //       moveBitboard: null,
  //     }));
  //   }
  // },

  // addHistoryEntry: (entry) => {
  //   set((state) => ({
  //     gameHistory: [...state.gameHistory, entry],
  //   }));
  // };
}));
