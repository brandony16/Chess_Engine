import { create } from "zustand";
import {
  BLACK,
  BLACK_PAWN,
  INITIAL_BITBOARDS,
  WHITE,
  WHITE_PAWN,
} from "./bitboardUtils/constants.mjs";
import { updateCastlingRights } from "./bitboardUtils/moveMaking/castleMoveLogic.mjs";
import { getNewEnPassant } from "./bitboardUtils/bbChessLogic.mjs";
import { computeAllAttackMasks } from "./bitboardUtils/PieceMasks/individualAttackMasks.mjs";
import { initializePieceAtArray } from "./bitboardUtils/pieceGetters.mjs";
import { initializePieceIndicies } from "./bitboardUtils/pieceIndicies.mjs";
import { EngineTypes, ModalTypes } from "./utilTypes";

const makeInitialState = () => ({
  // -----BOARD STATE-----
  bitboards: INITIAL_BITBOARDS.slice(),
  pastBitboards: [],
  pastMoves: [],
  pastPositions: new Map(),
  currPlayer: WHITE,
  boardViewSide: WHITE,
  enPassantSquare: null,
  castlingRights: [true, true, true, true], // WK, WQ, BK, BQ
  fiftyMoveRuleCounter: 0,
  promotion: false,
  promotionMove: null,

  // -----GAME META-----
  isGameOver: false,
  result: null,
  gameHistory: [],
  userSide: WHITE,
  selectedEngine: EngineTypes.BMV5,
  engineDepth: 4,
  engineTimeLimitMs: 5000,

  // -----UI STATE-----
  displayedBitboards: INITIAL_BITBOARDS.slice(),
  selectedSquare: null,
  moveBitboard: null,
  isCurrPositionShown: true,
  currIndexOfDisplayed: -1,

  // -----MODAL STATE-----
  isModalOpen: false,
  modalType: ModalTypes.NONE,

  // -----TERMINATE MOVE-----
  breakBattleLoop: false,
});

export const useGameStore = create((set, get) => {
  initializePieceIndicies(INITIAL_BITBOARDS);
  computeAllAttackMasks(INITIAL_BITBOARDS);
  initializePieceAtArray(INITIAL_BITBOARDS);
  const initialState = makeInitialState();
  set(initialState);

  return {
    ...initialState,

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

      const historyArr = historyEntry ? [...state.gameHistory, historyEntry] : state.gameHistory;

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
  };
});
