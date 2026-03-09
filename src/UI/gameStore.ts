import { create } from "zustand";
import { EngineTypes } from "./utilTypes.ts";
import type Move from "../game/moveMaking/move.ts";
import { Game } from "../game/Game.ts";
import {
  BLACK_WIN,
  DRAW,
  IN_PROGRESS,
  NO_SQUARE,
  WHITE,
  WHITE_WIN,
  type Player,
  type Square,
} from "../game/chessConstants.ts";
import { opponent } from "../game/helpers/opponent.ts";
import { Snapshot } from "../game/Snapshot.ts";
import { moveToAlgebraic } from "./generalHelpers.ts";
import { buildPGN } from "../game/fenAndUCI/pgn.ts";

export type ModalType = "history" | "battle" | "new";
export type HistoryEntry = { pgn: string; engineGame: boolean };
type ModalState = { isOpen: false } | { isOpen: true; type: ModalType };
type PromotionState =
  | { isHappening: false }
  | { isHappening: true; square: Square };

export const INITIAL_STATE = {
  userSide: WHITE,
  engine: "none",
  depth: 5,
  timeLimit: 5000,
} as const;

export interface GameStoreState {
  game: Game;
  userSide: Player;

  // ----- UI -----
  selectedSquare: Square;
  legalMovesForSelected: Move[];

  modalState: ModalState;
  boardPerspective: Player;

  promotion: PromotionState;

  // ----- ENGINE INFO -----
  selectedEngine: string;
  searchDepth: number;
  maxSearchTimeMs: number;

  pastPositions: Snapshot[];
  algebraicMoves: string[];
  currIdxOfDisplayed: number;

  pastGames: HistoryEntry[];

  // ----- ACTIONS -----
  playMove: (move: Move) => void;
  selectSquare: (square: Square) => void;
  resetGame: (fen?: string, wasEngineGame?: boolean) => void;
  flipBoard: () => void;
  openModal: (type: Exclude<ModalType, null>) => void;
  closeModal: () => void;
  showNextMove: () => void;
  showPreviousMove: () => void;
  goToMove: (halfmoveNumber: number) => void;

  updateShownGame: (entry: HistoryEntry) => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  game: new Game(),
  userSide: INITIAL_STATE.userSide,

  // ----- UI -----
  selectedSquare: NO_SQUARE,
  legalMovesForSelected: [],

  modalState: { isOpen: false },
  boardPerspective: WHITE,

  promotion: { isHappening: false },

  // ----- ENGINE INFO -----
  selectedEngine: INITIAL_STATE.engine,
  searchDepth: INITIAL_STATE.depth,
  maxSearchTimeMs: INITIAL_STATE.timeLimit,

  pastPositions: [],
  algebraicMoves: [],
  currIdxOfDisplayed: -1,

  pastGames: [],

  // ACTIONS / UPDATER FUNCTIONS
  playMove: (move: Move) => {
    const { game, pastPositions, algebraicMoves } = get();

    const success = game.playMove(move);
    if (!success) return;

    const algebraic = moveToAlgebraic(move, game.isInCheck(), game.isOver());

    set({
      game,
      selectedSquare: NO_SQUARE,
      legalMovesForSelected: [],
      algebraicMoves: [...algebraicMoves, algebraic],
      pastPositions: [...pastPositions, game.getSnapshot()],
      currIdxOfDisplayed: pastPositions.length - 1,
    });
  },

  selectSquare: (square: Square) => {
    const { game } = get();

    if (square === NO_SQUARE) {
      set({ selectedSquare: NO_SQUARE, legalMovesForSelected: [] });
    }

    const moves = game.legalMovesFrom(square);

    set({
      selectedSquare: square,
      legalMovesForSelected: moves,
    });
  },

  resetGame: (fen?: string, wasEngineGame: boolean = false): void => {
    const { game, pastGames, algebraicMoves, userSide } = get();

    let updatedPast = pastGames;
    if (game.isOver()) {
      const result = game.result();
      const gamePGN = buildPGN(algebraicMoves, {
        Event: wasEngineGame ? "Engine Game" : "Normal Battle",
        White: userSide === WHITE ? "User" : "Engine",
        Black: userSide === WHITE ? "Engine" : "User",
        Result:
          result.winner === DRAW
            ? "1/2-1/2"
            : result.winner === WHITE
              ? "1-0"
              : "0-1",
      });
      const entry: HistoryEntry = { pgn: gamePGN, engineGame: wasEngineGame };
      updatedPast = [...pastGames, entry];
    }

    const newGame = new Game(fen);

    set({
      game: newGame,
      selectedSquare: NO_SQUARE,
      legalMovesForSelected: [],
      pastGames: updatedPast,
      pastPositions: [],
      algebraicMoves: [],

      modalState: { isOpen: false },

      currIdxOfDisplayed: -1,
    });
  },

  flipBoard: () => {
    set((state) => ({
      boardPerspective: opponent(state.boardPerspective),
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
    set((state) => {
      if (state.currIdxOfDisplayed === state.pastPositions.length - 1) {
        return state;
      }

      const newIdx = state.currIdxOfDisplayed + 1;

      return {
        currIdxOfDisplayed: newIdx,
      };
    });
  },

  showPreviousMove: () => {
    set((state) => {
      if (state.currIdxOfDisplayed === 0) {
        return state;
      }

      const newIdx = state.currIdxOfDisplayed - 1;

      return {
        currIdxOfDisplayed: newIdx,
      };
    });
  },

  goToMove: (halfmoveNumber: number) => {
    set((state) => {
      if (halfmoveNumber < 0 || halfmoveNumber >= state.pastPositions.length) {
        throw new Error(`Invalid jump to halfmove ${halfmoveNumber}`);
      }

      return {
        currIdxOfDisplayed: halfmoveNumber,
      };
    });
  },

  updateShownGame: (entry: HistoryEntry) => {
    // update stuff idk
    console.log(entry);
  },
}));
