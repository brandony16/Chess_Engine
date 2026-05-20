import { create } from "zustand";
import { Game } from "../game/Game.ts";
import {
  BLACK,
  DRAW,
  NO_SQUARE,
  WHITE,
  type Player,
  type Square,
} from "../game/chessConstants.ts";
import { opponent } from "../game/helpers/opponent.ts";
import { Snapshot } from "../game/Snapshot.ts";
import { moveToAlgebraic } from "./generalHelpers.ts";
import { buildPGN } from "../game/fenAndUCI/pgn.ts";
import type { Move } from "../game/moveMaking/move.ts";
import { engineNames } from "../engines/bondmonkeyVersions/engineList.ts";
import {
  KIWIPETE_POS,
  LOCKED_MIDDLEGAME,
  START_POS,
  TRANSPOSITION_ENDGAME,
} from "../__tests__/game_tests/fens.ts";
import { MAX_SEARCH_PLY } from "../engines/Engine.ts";
import { OpeningBook } from "../OpeningBook.ts";

export type ModalType = "history" | "battle" | "new";
export type HistoryEntry = {
  pgn: string;
  engineGame: boolean;
  white: string;
  black: string;
  plyCount: number;
};
type ModalState = { isOpen: false } | { isOpen: true; type: ModalType };
type PromotionState =
  | { isHappening: false }
  | { isHappening: true; square: Square };

export const INITIAL_STATE = {
  fen: START_POS,
  userSide: WHITE,
  engine: engineNames[0], // most recent engine
  depth: MAX_SEARCH_PLY, // time limited, not depth limited
  timeLimit: 1000,
} as const;

export interface GameStoreState {
  game: Game;
  book: OpeningBook;
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
  resetGame: (
    fen?: string,
    newUserSide?: Player,
    wasEngineGame?: boolean,
  ) => void;
  flipBoard: () => void;
  openModal: (type: Exclude<ModalType, null>) => void;
  closeModal: () => void;
  showNextMove: () => void;
  showPreviousMove: () => void;
  goToMove: (halfmoveNumber: number) => void;

  updateShownGame: (entry: HistoryEntry) => void;
}

export const useGameStore = create<GameStoreState>((set, get) => {
  const game = new Game(INITIAL_STATE.fen);
  const book = new OpeningBook();
  book.initialize();

  return {
    game: game,
    book: book,
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

    pastPositions: [game.getSnapshot()],
    algebraicMoves: [],
    currIdxOfDisplayed: 0,

    pastGames: [],

    // ACTIONS / UPDATER FUNCTIONS
    playMove: (move: Move) => {
      const { game, pastPositions, algebraicMoves } = get();

      const success = game.playMove(move);
      if (!success) {
        return;
      }

      const algebraic = moveToAlgebraic(move, game.isInCheck(), game.isOver());

      set({
        game,
        selectedSquare: NO_SQUARE,
        legalMovesForSelected: [],
        algebraicMoves: [...algebraicMoves, algebraic],
        pastPositions: [...pastPositions, game.getSnapshot()],
        currIdxOfDisplayed: pastPositions.length,
        promotion: { isHappening: false },
      });
    },

    resetGame: (
      fen?: string,
      newUserSide: Player = WHITE,
      wasEngineGame: boolean = false,
    ): void => {
      const { game, pastGames, algebraicMoves, userSide, selectedEngine } =
        get();

      let updatedPast = pastGames;
      if (game.isOver()) {
        const result = game.result();

        const whiteSide = userSide === WHITE ? "user" : selectedEngine;
        const blackSide = userSide === BLACK ? "user" : selectedEngine;

        const gamePGN = buildPGN(algebraicMoves, {
          Event: wasEngineGame ? "Engine Game" : "Normal Battle",
          White: whiteSide,
          Black: blackSide,
          Result:
            result.winner === DRAW
              ? "1/2-1/2"
              : result.winner === WHITE
                ? "1-0"
                : "0-1",
        });
        const entry: HistoryEntry = {
          pgn: gamePGN,
          engineGame: wasEngineGame,
          white: whiteSide,
          black: blackSide,
          plyCount: algebraicMoves.length,
        };
        updatedPast = [...pastGames, entry];
      }

      const newGame = new Game(fen);

      set({
        game: newGame,
        userSide: newUserSide,
        boardPerspective: newUserSide,
        selectedSquare: NO_SQUARE,
        legalMovesForSelected: [],
        pastGames: updatedPast,
        algebraicMoves: [],

        modalState: { isOpen: false },

        currIdxOfDisplayed: 0,
        pastPositions: [newGame.getSnapshot()],
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
        if (
          halfmoveNumber < 0 ||
          halfmoveNumber >= state.pastPositions.length
        ) {
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
  };
});
