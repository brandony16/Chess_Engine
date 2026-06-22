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
import { moveFrom, moveTo, type Move } from "../game/moveMaking/move.ts";
import {
  engineNames,
  type EngineName,
} from "../engines/bondmonkeyVersions/engineList.ts";
import { START_POS } from "../__tests__/game_tests/fens.ts";
import { MAX_SEARCH_PLY } from "../engines/Engine.ts";
import { OpeningBook } from "../OpeningBook.ts";
import { squareToIndex } from "../game/fenAndUCI/uciHelpers.ts";
import { TC_3_2, type TimeControl } from "./timeControls.ts";

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
export type NewGameParams = {
  fen: string;
  userSide: Player;
  clockSettings: { timePerPlayer: number; increment: number };
  selectedEngine: EngineName;
};

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
  userResigned: boolean;
}

interface GameSlice extends GameSliceVars {
  playMove: (move: Move, timeRemaining: number) => void;
  saveGame: (isEngineGame?: boolean) => void;
  newGame: (params: NewGameParams) => void;
  flipBoard: () => void;
  showNextMove: () => void;
  showPreviousMove: () => void;
  goToMove: (halfmoveNumber: number) => void;
  isGameOver: () => boolean;
  updateShownGame: (entry: HistoryEntry) => void;
  resignGame: () => void;
}

interface UISliceVars {
  selectedSquare: Square;
  legalMovesForSelected: Move[];
  modalState: ModalState;
  promotion: PromotionState;
  timeSpentPerMove: number[];
  moveHighlights: Square[];
  sidebarMode: "setup" | "playing" | "history";
}

interface UISlice extends UISliceVars {
  setSelectedSquare: (square: Square, legalMoves?: Move[]) => void;
  setPromotion: (state: PromotionState) => void;
  openModal: (type: Exclude<ModalType, null>) => void;
  closeModal: () => void;
  setSidebarMode: (mode: "setup" | "playing" | "history") => void;
}

interface EngineSliceVars {
  selectedEngine: EngineName;
  searchDepth: number;
  clockSettings: TimeControl;
}
interface EngineSlice extends EngineSliceVars {
  setEngine: (engine: EngineName) => void;
}

interface ClockSliceVars {
  isTimeOut: boolean;
  timeOutLoser: Player | null;
}

interface ClockSlice extends ClockSliceVars {
  handleTimeOut: (losingSide: Player) => void;
}

export type GameStoreState = GameSlice & UISlice & EngineSlice & ClockSlice;

// ----- INITIAL STATES -----
export const INITIAL_GAME_SLICE: GameSliceVars = {
  fen: game.fen(),
  userSide: WHITE,
  boardPerspective: WHITE,
  pastPositions: [game.getSnapshot()],
  algebraicMoves: [],
  idxOfDisplayedMove: 0,
  pastGames: [],
  whiteTimeMs: TC_3_2.timePerPlayer,
  blackTimeMs: TC_3_2.timePerPlayer,
  lastMoveTimestamp: Date.now(),
  userResigned: false,
};

export const INITIAL_UI_SLICE: UISliceVars = {
  selectedSquare: NO_SQUARE,
  legalMovesForSelected: [],
  modalState: { isOpen: false },
  promotion: { isHappening: false },
  timeSpentPerMove: [],
  moveHighlights: [],
  sidebarMode: "setup",
};

export const INITIAL_ENGINE_SLICE: EngineSliceVars = {
  selectedEngine: engineNames[0],
  searchDepth: MAX_SEARCH_PLY,
  clockSettings: TC_3_2,
};

export const INITIAL_CLOCK_SLICE: ClockSliceVars = {
  isTimeOut: false,
  timeOutLoser: null,
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  // ----- GAME SLICE -----
  ...INITIAL_GAME_SLICE,

  playMove: (move: Move, timeRemaining: number): void => {
    const {
      pastPositions,
      algebraicMoves,
      whiteTimeMs,
      blackTimeMs,
      lastMoveTimestamp,
      timeSpentPerMove,
      sidebarMode,
    } = get();

    if (sidebarMode !== "playing") return;

    const isWhiteTurn = game.fen().split(" ")[1] === "w";

    const success = game.playMove(move);
    if (!success) return;

    const algebraic = moveToAlgebraic(move, game.isInCheck(), game.isOver());

    const currTimestamp = Date.now();
    const approxTimeSpent = currTimestamp - lastMoveTimestamp;

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

      lastMoveTimestamp: currTimestamp,
      timeSpentPerMove: [...timeSpentPerMove, approxTimeSpent],
      moveHighlights: [moveFrom(move), moveTo(move)],
    });
  },

  saveGame: (isEngineGame: boolean = false): void => {
    const { pastGames, algebraicMoves, userSide, selectedEngine, isGameOver } =
      get();

    let updatedPast = pastGames;
    if (isGameOver()) {
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

      whiteTimeMs: params.clockSettings.timePerPlayer,
      blackTimeMs: params.clockSettings.timePerPlayer,
      clockSettings: params.clockSettings,
      lastMoveTimestamp: Date.now(),

      selectedEngine: params.selectedEngine,

      modalState: { isOpen: false },

      idxOfDisplayedMove: 0,
      pastPositions: [game.getSnapshot()],

      isTimeOut: false,
      timeOutLoser: null,
      moveHighlights: [],
      sidebarMode: "playing",
    });
  },

  flipBoard: () =>
    set((state) => ({ boardPerspective: opponent(state.boardPerspective) })),

  showNextMove: () =>
    set((state) => {
      const newIdxOfDisplayed = Math.min(
        state.idxOfDisplayedMove + 1,
        state.pastPositions.length - 1,
      );

      if (newIdxOfDisplayed === state.idxOfDisplayedMove) {
        return {}; // at end of move list already, nothing changed
      }

      // game stores uci moves, which are much easier to parse
      // need to find the move that got us to this position to highlight the correct squares
      // that is the move at the current idxOfDisplayedMove, not the newIdxOfDisplayed
      const uciMove = game.moveHistory[state.idxOfDisplayedMove];
      const from = squareToIndex(uciMove.slice(0, 2)) as Square;
      const to = squareToIndex(uciMove.slice(2, 4)) as Square;

      return {
        idxOfDisplayedMove: newIdxOfDisplayed,
        moveHighlights: [from, to],
        legalMovesForSelected: [],
        selectedSquare: NO_SQUARE,
        promotion: { isHappening: false },
      };
    }),

  showPreviousMove: () =>
    set((state) => {
      const newIdxOfDisplayed = Math.max(state.idxOfDisplayedMove - 1, 0);

      let newHighlights: Square[] = [];
      if (newIdxOfDisplayed - 1 >= 0) {
        // game stores uci moves, which are much easier to parse
        // need the move that got us to the new position, which is at idx 1 less than the new idx
        const uciMove = game.moveHistory[newIdxOfDisplayed - 1];
        const from = squareToIndex(uciMove.slice(0, 2)) as Square;
        const to = squareToIndex(uciMove.slice(2, 4)) as Square;
        newHighlights = [from, to];
      }

      return {
        idxOfDisplayedMove: newIdxOfDisplayed,
        moveHighlights: newHighlights,
        legalMovesForSelected: [],
        selectedSquare: NO_SQUARE,
        promotion: { isHappening: false },
      };
    }),

  goToMove: (halfmoveNumber: number) =>
    set((state) => {
      if (halfmoveNumber < 0 || halfmoveNumber >= state.pastPositions.length)
        return state;

      // game stores uci moves, which are much easier to parse
      const uciMove = game.moveHistory[halfmoveNumber];
      const from = squareToIndex(uciMove.slice(0, 2)) as Square;
      const to = squareToIndex(uciMove.slice(2, 4)) as Square;

      return {
        idxOfDisplayedMove: halfmoveNumber + 1, // offset by 1 to account for the starting position, which is idx 0
        moveHighlights: [from, to],
        legalMovesForSelected: [],
        selectedSquare: NO_SQUARE,
        promotion: { isHappening: false },
      };
    }),

  isGameOver: () => {
    const { isTimeOut, userResigned } = get();
    return isTimeOut || userResigned || game.isOver();
  },

  resignGame: () => set({ userResigned: true }),

  // ----- UI SLICE -----
  ...INITIAL_UI_SLICE,

  setSelectedSquare: (square: Square, legalMoves: number[] = []) =>
    set({ selectedSquare: square, legalMovesForSelected: legalMoves }),
  setPromotion: (state: PromotionState) => set({ promotion: state }),
  openModal: (type: ModalType) => set({ modalState: { isOpen: true, type } }),
  closeModal: () => set({ modalState: { isOpen: false } }),
  setSidebarMode: (mode: "setup" | "playing" | "history") =>
    set({ sidebarMode: mode }),

  updateShownGame: (entry: HistoryEntry) => {},

  // ----- ENGINE SLICE -----
  ...INITIAL_ENGINE_SLICE,

  setEngine: (engine) => set({ selectedEngine: engine }),

  // ----- CLOCK SLICE -----
  ...INITIAL_CLOCK_SLICE,

  handleTimeOut: (losingSide: Player) =>
    set({
      isTimeOut: true,
      timeOutLoser: losingSide,

      // Hard-clamp the loser's time to 0 to prevent any lingering interval bugs
      whiteTimeMs: losingSide === WHITE ? 0 : get().whiteTimeMs,
      blackTimeMs: losingSide === BLACK ? 0 : get().blackTimeMs,
    }),
}));
