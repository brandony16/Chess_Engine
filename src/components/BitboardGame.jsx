import { useEffect, useMemo } from "react";
import PromotionModal from "./modals/PromotionModal";
import Sidebar from "./sidebar/Sidebar";
import "./UI.css";
import BitboardBoard from "./boardComponents/BitboardBoard";
import { makeMove } from "../Core Logic/moveMaking/makeMoveLogic.mjs";
import { computeHash } from "../Core Logic/zobristHashing.mjs";
import { checkGameOver } from "../Core Logic/gameOverLogic.mjs";
import { movesToBB, moveToReadable } from "../Core Logic/generalHelpers.mjs";
import {
  isPlayersPieceAtSquare,
  pieceAt,
} from "../Core Logic/pieceGetters.mjs";
import { getAllLegalMoves } from "../Core Logic/moveGeneration/allMoveGeneration.mjs";
import { getNewEnPassant } from "../Core Logic/bbChessLogic.mjs";
import { useGameStore } from "./gameStore.mjs";
import Modal from "./modals/Modal";
import { BLACK_PAWN, WHITE_PAWN } from "../Core Logic/constants.mjs";
import Move from "../Core Logic/moveMaking/move.mjs";
import { isKing } from "../Core Logic/bbUtils.mjs";

import EngineWorker from "./bbEngines/engineWorker.mjs?worker";

// Runs the game
const BitboardGame = () => {
  const {
    currPlayer,
    userSide,
    promotion,
    promotionMove,
    isGameOver,
    isModalOpen,
    changeViewedMove,
  } = useGameStore();

  // Create the single engine worker
  const engineWorker = useMemo(() => {
    const w = new EngineWorker();
    w.onmessage = (e) => {
      const { move } = e.data;
      processMove(move.from, move.to, move.promotion);
    };
    return w;
  }, []);

  // FUNCTIONS ----------------------------------------------------------------
  /**
   * Processes a move by making the move and updating state.
   *
   * @param {int} from - the square the piece is moving from
   * @param {int} to - the square the piece is moving to
   * @param {int} promotion - the piece to promote to
   */
  const processMove = (from, to, promotion = null) => {
    const {
      bitboards,
      currPlayer,
      castlingRights,
      enPassantSquare,
      pastPositions,
      updateStates,
      fiftyMoveRuleCounter,
    } = useGameStore.getState();

    // Get variables for Move object
    const piece = pieceAt[from];
    const castling = isKing(piece) && Math.abs(from - to) === 2;
    const enPassant =
      to === enPassantSquare && (piece === WHITE_PAWN || piece === BLACK_PAWN);
    let captured = pieceAt[to];
    if (enPassant) {
      captured = piece === WHITE_PAWN ? BLACK_PAWN : WHITE_PAWN;
    }

    const move = new Move(
      from,
      to,
      piece,
      captured,
      promotion,
      castling,
      enPassant
    );

    makeMove(bitboards, move);

    const newEnPassant = getNewEnPassant(move);
    const epFile = newEnPassant ? newEnPassant % 8 : -1;

    const hash = computeHash(bitboards, currPlayer, epFile, castlingRights);

    pastPositions.set(hash, (pastPositions.get(hash) || 0) + 1);

    const gameOverObj = checkGameOver(
      bitboards,
      currPlayer,
      pastPositions,
      newEnPassant,
      fiftyMoveRuleCounter
    );

    const readableMove = moveToReadable(
      bitboards,
      from,
      to,
      move.captured !== null
    );

    updateStates(readableMove, move, gameOverObj);
  };

  /**
   * Handles when a square is clicked. Sets the selected square, makes a move,
   * handles when its a promotion move
   *
   * @param {int} row - the row of the square that was clicked
   * @param {int} col - the column of the square that was clicked
   */
  const handleSquareClick = (row, col) => {
    const {
      isCurrPositionShown,
      isGameOver,
      bitboards,
      currPlayer,
      castlingRights,
      enPassantSquare,
      userSide,
      selectedSquare,
    } = useGameStore.getState();
    if (isGameOver || !isCurrPositionShown || userSide !== currPlayer) return;

    const square = row * 8 + col;
    // Sets a selected square and gets the move bitboard for that piece
    if (isPlayersPieceAtSquare(currPlayer, square, bitboards)) {
      useGameStore.setState({ selectedSquare: square });

      const moves = getAllLegalMoves(
        bitboards,
        currPlayer,
        castlingRights,
        enPassantSquare
      );

      const moveBB = movesToBB(moves.filter((a) => a.from === square));

      useGameStore.setState({
        moveBitboard: moveBB,
        promotion: false,
        promotionMove: null,
      });
      return;
    }

    // Handles when a move is being made.
    if (selectedSquare !== null) {
      const moveBitboard = useGameStore.getState().moveBitboard;
      const mask = 1n << BigInt(square);

      if (moveBitboard & mask) {
        const piece = pieceAt[selectedSquare];

        // Promotion
        if (
          (row === 7 || row === 0) &&
          (piece === WHITE_PAWN || piece === BLACK_PAWN)
        ) {
          useGameStore.setState({
            promotion: true,
            promotionMove: { from: selectedSquare, to: square },
          });
          return;
        }

        processMove(selectedSquare, square);
      } else {
        useGameStore.setState({
          selectedSquare: null,
          moveBitboard: null,
          promotion: false,
          promotionMove: null,
        });
      }
    }
  };

  /**
   * Handles when a promotion happens. Called after the user clicks a piece
   * to promote to.
   * @param {int} piece - the piece to promote to
   */
  const handlePromotion = (piece) => {
    const { promotionMove } = useGameStore.getState();
    const from = promotionMove.from;
    const to = promotionMove.to;

    processMove(from, to, piece);
  };

  /**
   * Gets the move of the engine from the worker
   *
   * @param {int} depth - the depth for the engine to search
   * @param {int} timeLimit - the time the engine has to make a move in ms
   */
  const getEngineMove = () => {
    if (!engineWorker) return;
    const state = useGameStore.getState();

    engineWorker.postMessage({
      bitboards: state.bitboards,
      player: state.currPlayer,
      castlingRights: state.castlingRights,
      enPassantSquare: state.enPassantSquare,
      prevPositions: state.pastPositions,
      engine: state.selectedEngine,
      maxDepth: state.engineDepth,
      timeLimit: state.engineTimeLimitMs,
    });
  };

  // Runs the engine move after the user makes a move
  useEffect(() => {
    if (currPlayer !== userSide && !isGameOver && userSide !== null) {
      getEngineMove();
    }
  }, [currPlayer, userSide]);

  return (
    <div className="body">
      <div className="gameWrap">
        <BitboardBoard onSquareClick={handleSquareClick} />
        {promotion && (
          <PromotionModal
            onPromote={handlePromotion}
            square={promotionMove.to}
            userPlayer={userSide}
          />
        )}
        <Sidebar changeBoardView={changeViewedMove} />
      </div>
      {isModalOpen && <Modal />}
    </div>
  );
};

export default BitboardGame;
