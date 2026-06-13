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
import {
  engineNames,
  type EngineName,
} from "../engines/bondmonkeyVersions/engineList.ts";
import { START_POS } from "../__tests__/game_tests/fens.ts";
import { INFINITY, MAX_SEARCH_PLY } from "../engines/Engine.ts";
import { OpeningBook } from "../OpeningBook.ts";
import { ContextType, type ClockType } from "../engines/searchContext.ts";

// ----- EXTERNAL VARIABLES -----
export const game = new Game(START_POS);
export const openingBook = new OpeningBook();
openingBook.initialize();

// ----- STATE INTERFACES -----
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
type NewGameParams = { fen: string; userSide: Player };

interface GameSliceVars {
  fen: string;
  userSide: Player;
  boardPerspective: Player;
  pastPositions: Snapshot[];
  algebraicMoves: string[];
  idxOfDisplayedMove: number;
  pastGames: HistoryEntry[];
  whiteTimeMs: number;
  blackTimeMs: number;
  lastMoveTimestamp: number;
}

interface GameSlice extends GameSliceVars {
  playMove: (move: Move, timeRemaining: number) => void;
  saveGame: (isEngineGame?: boolean) => void;
  newGame: (params: NewGameParams) => void;
  flipBoard: () => void;
  showNextMove: () => void;
  showPreviousMove: () => void;
  goToMove: (halfmoveNumber: number) => void;
}

interface UISliceVars {
  selectedSquare: Square;
  legalMovesForSelected: Move[];
  modalState: ModalState;
  promotion: PromotionState;
}

interface UISlice extends UISliceVars {
  setSelectedSquare: (square: Square, legalMoves?: Move[]) => void;
  setPromotion: (state: PromotionState) => void;
  openModal: (type: Exclude<ModalType, null>) => void;
  closeModal: () => void;
}

interface EngineSliceVars {
  selectedEngine: EngineName;
  searchDepth: number;
  clockSettings: { timePerPlayer: number; increment: number };
}
interface EngineSlice extends EngineSliceVars {
  setEngine: (engine: EngineName) => void;
}

export type GameStoreState = GameSlice & UISlice & EngineSlice;

// ----- INITIAL STATES -----
export const TIME_CONTROL_3_2 = {
  timePerPlayer: 3 * 60 * 1000, // 3 minutes
  increment: 2000, // 2s increment
};

export const TIME_CONTROL_BULLET = {
  timePerPlayer: 60 * 1000,
  increment: 1000,
};

export const INITIAL_GAME_SLICE: GameSliceVars = {
  fen: game.fen(),
  userSide: WHITE,
  boardPerspective: WHITE,
  pastPositions: [game.getSnapshot()],
  algebraicMoves: [],
  idxOfDisplayedMove: 0,
  pastGames: [],
  whiteTimeMs: TIME_CONTROL_BULLET.timePerPlayer,
  blackTimeMs: TIME_CONTROL_BULLET.timePerPlayer,
  lastMoveTimestamp: Date.now(),
};

export const INITIAL_UI_SLICE: UISliceVars = {
  selectedSquare: NO_SQUARE,
  legalMovesForSelected: [],
  modalState: { isOpen: false },
  promotion: { isHappening: false },
};

export const INITIAL_ENGINE_SLICE: EngineSliceVars = {
  selectedEngine: engineNames[0],
  searchDepth: MAX_SEARCH_PLY,
  clockSettings: TIME_CONTROL_BULLET,
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  // ----- GAME SLICE -----
  ...INITIAL_GAME_SLICE,

  playMove: (move: Move, timeRemaining: number): void => {
    const { pastPositions, algebraicMoves, whiteTimeMs, blackTimeMs } = get();

    const isWhiteTurn = game.fen().split(" ")[1] === "w";

    const success = game.playMove(move);
    if (!success) return;

    const algebraic = moveToAlgebraic(move, game.isInCheck(), game.isOver());

    set({
      fen: game.fen(),
      selectedSquare: NO_SQUARE,
      legalMovesForSelected: [],
      algebraicMoves: [...algebraicMoves, algebraic],
      pastPositions: [...pastPositions, game.getSnapshot()],
      idxOfDisplayedMove: pastPositions.length,
      promotion: { isHappening: false },

      whiteTimeMs: isWhiteTurn ? timeRemaining : whiteTimeMs,
      blackTimeMs: !isWhiteTurn ? timeRemaining : blackTimeMs,

      lastMoveTimestamp: Date.now(),
    });
  },

  saveGame: (isEngineGame: boolean = false): void => {
    const { pastGames, algebraicMoves, userSide, selectedEngine } = get();

    let updatedPast = pastGames;
    if (game.isOver()) {
      const result = game.result();

      const whiteSide = userSide === WHITE ? "user" : selectedEngine;
      const blackSide = userSide === BLACK ? "user" : selectedEngine;

      const gamePGN = buildPGN(algebraicMoves, {
        Event: isEngineGame ? "Engine Game" : "Normal Battle",
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
        engineGame: isEngineGame,
        white: whiteSide,
        black: blackSide,
        plyCount: algebraicMoves.length,
      };
      updatedPast = [...pastGames, entry];
    }

    set({
      pastGames: updatedPast,
    });
  },

  newGame: (params: NewGameParams): void => {
    game.loadFen(params.fen);

    set({
      fen: params.fen,
      userSide: params.userSide,
      boardPerspective: params.userSide,
      selectedSquare: NO_SQUARE,
      legalMovesForSelected: [],
      algebraicMoves: [],

      modalState: { isOpen: false },

      idxOfDisplayedMove: 0,
      pastPositions: [game.getSnapshot()],
    });
  },

  flipBoard: () =>
    set((state) => ({ boardPerspective: opponent(state.boardPerspective) })),

  showNextMove: () =>
    set((state) => ({
      idxOfDisplayedMove: Math.min(
        state.idxOfDisplayedMove + 1,
        state.pastPositions.length - 1,
      ),
    })),

  showPreviousMove: () =>
    set((state) => ({
      idxOfDisplayedMove: Math.max(state.idxOfDisplayedMove - 1, 0),
    })),

  goToMove: (halfmoveNumber: number) =>
    set((state) => {
      if (halfmoveNumber < 0 || halfmoveNumber >= state.pastPositions.length)
        return state;
      return { idxOfDisplayedMove: halfmoveNumber };
    }),

  // ----- UI SLICE -----
  ...INITIAL_UI_SLICE,

  setSelectedSquare: (square, legalMoves = []) =>
    set({ selectedSquare: square, legalMovesForSelected: legalMoves }),
  setPromotion: (state) => set({ promotion: state }),
  openModal: (type) => set({ modalState: { isOpen: true, type } }),
  closeModal: () => set({ modalState: { isOpen: false } }),

  // ----- ENGINE SLICE -----
  ...INITIAL_ENGINE_SLICE,

  setEngine: (engine) => set({ selectedEngine: engine }),
}));
