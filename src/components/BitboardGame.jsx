import { useEffect, useMemo } from "react";
import PromotionModal from "./modals/PromotionModal";
import Sidebar from "./sidebar/Sidebar";
import "./UI.css";
import BitboardBoard from "./boardComponents/BitboardBoard";
import { getCachedAttackMask } from "./bitboardUtils/PieceMasks/attackMask";
import {
  isValidMove,
  updatedMakeMove,
} from "./bitboardUtils/moveMaking/makeMoveLogic";
import { computeHash } from "./bitboardUtils/zobristHashing";
import { checkGameOver } from "./bitboardUtils/gameOverLogic";
import { moveToReadable } from "./bitboardUtils/generalHelpers";
import {
  getPieceAtSquare,
  isPlayersPieceAtSquare,
} from "./bitboardUtils/pieceGetters";
import { getPieceMoves } from "./bitboardUtils/moveGeneration/allMoveGeneration";
import {
  filterIllegalMoves,
  getNewEnPassant,
} from "./bitboardUtils/bbChessLogic";
import { useGameStore } from "./gameStore";
import Modal from "./modals/Modal";
import {
  BLACK_PAWN,
  INITIAL_BITBOARDS,
  WHITE_PAWN,
} from "./bitboardUtils/constants";
import { computeAllAttackMasks } from "./bitboardUtils/PieceMasks/individualAttackMasks";
import Move from "./bitboardUtils/moveMaking/move";
import { isKing } from "./bitboardUtils/bbUtils";

// Runs the game
const BitboardGame = () => {
  const {
    selectedSquare,
    moveBitboard,
    currPlayer,
    userSide,
    promotion,
    promotionMove,
    isGameOver,
    result,
    pastMoves,
    displayedBitboards,
    currIndexOfDisplayed,
    resetGame,
    isModalOpen,
    isGameHistoryMenuOpen,
    isBattleEnginesOpen,
  } = useGameStore();

  computeAllAttackMasks(INITIAL_BITBOARDS);

  // Creates a new worker
  const worker = useMemo(() => {
    return new Worker(new URL("./bbEngines/engineWorker.js", import.meta.url), {
      type: "module",
    });
  }, []);

  // FUNCTIONS ----------------------------------------------------------------
  /**
   * Makes a move with the given engine
   *
   * @param {function} engine - the engine to use for the move
   * @param {int} depth - the depth to search
   * @param {int} timeLimit - the time limit the engine has for a move in ms
   */
  const makeEngineMove = (engine, depth = 3, timeLimit = Infinity) => {
    const {
      isCurrPositionShown,
      isGameOver,
      bitboards,
      currPlayer,
      castlingRights,
      enPassantSquare,
      pastPositions,
    } = useGameStore.getState();

    if (!isCurrPositionShown || isGameOver) return;

    const bestMove = engine(
      bitboards,
      currPlayer,
      castlingRights,
      enPassantSquare,
      pastPositions,
      depth,
      timeLimit
    );
    const from = bestMove.from;
    const to = bestMove.to;
    const promotion = bestMove.promotion;

    processMove(from, to, promotion);
  };

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

    const piece = getPieceAtSquare(from, bitboards);
    const captured = getPieceAtSquare(to, bitboards);
    const castling = isKing(piece) && Math.abs(from - to) === 2;
    const enPassant = to === enPassantSquare;
    const move = new Move(
      from,
      to,
      piece,
      captured,
      promotion,
      castling,
      enPassant
    );
    updatedMakeMove(bitboards, move);
    const newEnPassant = getNewEnPassant(move);

    const hash = computeHash(
      bitboards,
      currPlayer,
      newEnPassant,
      castlingRights
    );

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

    // Ensures the attack map cache has the new attack map
    getCachedAttackMask(bitboards, currPlayer);

    updateStates(readableMove, move, hash, gameOverObj, selectedSquare);
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
      const piece = getPieceAtSquare(square, bitboards);

      const moveBitboard = getPieceMoves(
        bitboards,
        piece - 6 * currPlayer, // normalizes piece to be between 0 and 5
        square,
        currPlayer,
        enPassantSquare,
        castlingRights
      );

      const filteredMoveBitboard = filterIllegalMoves(
        bitboards,
        moveBitboard,
        square,
        currPlayer
      );

      useGameStore.setState({
        moveBitboard: filteredMoveBitboard,
        promotion: false,
        promotionMove: null,
      });
      return;
    }

    // Handles when a move is being made.
    if (selectedSquare !== null) {
      if (
        isValidMove(
          bitboards,
          selectedSquare,
          square,
          currPlayer,
          enPassantSquare,
          castlingRights
        )
      ) {
        const piece = getPieceAtSquare(selectedSquare, bitboards);

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
   * Changes what move is visible to the user. The direction should be -1 or 1
   * for moving one move back and forward.
   *
   * @param {int} direction - what move you want to go to (-1, 1)
   */
  const changeBoardView = (direction) => {
    const { currIndexOfDisplayed, pastBitboards } = useGameStore.getState();

    const index = currIndexOfDisplayed + direction;

    if (index < 0 || index >= pastBitboards.length) return;

    useGameStore.setState({
      displayedBitboards: pastBitboards[index],
      currIndexOfDisplayed:
        useGameStore.getState().currIndexOfDisplayed + direction,
    });

    if (index === pastBitboards.length - 1) {
      useGameStore.setState({ isCurrPositionShown: true });
    } else {
      useGameStore.setState({
        isCurrPositionShown: false,
        selectedSquare: null,
        moveBitboard: null,
      });
    }
  };

  /**
   * Battles two engines, alternating the side each plays.
   *
   * @param {function} engine1 - the engine that starts with white
   * @param {function} engine2 - the engine that starts with black
   * @param {int} games - the number of games to play
   * @param {int} depth - the depth to search for each move
   */
  const battleTwoEngines = (engine1, engine2, games = 10, depth = 3) => {
    resetGame();
    useGameStore.setState({ userSide: null });

    let wins = 0;
    let draws = 0;
    let losses = 0;

    let gameNum = 1;
    let whiteSide = engine1;
    let blackSide = engine2;
    while (gameNum <= games) {
      resetGame(true);
      console.log("Game " + gameNum + " started");

      while (!useGameStore.getState().isGameOver) {
        makeEngineMove(whiteSide, depth, 5000);
        if (useGameStore.getState().isGameOver) break;

        makeEngineMove(blackSide, depth, 5000);
        if (useGameStore.getState().isGameOver) break;
      }
      const result = useGameStore.getState().result;
      console.log("Game " + gameNum + " Over");
      console.log(result);
      const engineNum = gameNum % 2 === 1 ? 1 : 2;
      console.log("With white being engine" + engineNum);

      const resultChar = result.charAt(0);
      const engineSide = engineNum === 1 ? "W" : "B";
      if (resultChar === engineSide) {
        wins++;
      } else if (resultChar === "D") {
        draws++;
      } else {
        losses++;
      }

      resetGame(true);
      const temp = whiteSide;
      whiteSide = blackSide;
      blackSide = temp;
      gameNum++;
    }

    console.log("Engine1 Stats:");
    console.log("\n Wins: " + wins);
    console.log("\n Draws: " + draws);
    console.log("\n Losses: " + losses);
    const winRate = (wins / games) * 100;
    console.log("Win Rate: " + winRate + "%");
  };

  /**
   * Gets the move of the engine from the worker
   *
   * @param {int} depth - the depth for the engine to search
   * @param {int} timeLimit - the time the engine has to make a move in ms
   */
  const getEngineMove = (depth, timeLimit) => {
    if (!worker) return;
    const state = useGameStore.getState();
    worker.postMessage({
      bitboards: state.bitboards,
      player: state.currPlayer,
      castlingRights: state.castlingRights,
      enPassantSquare: state.enPassantSquare,
      prevPositions: state.pastPositions,
      maxDepth: depth,
      timeLimit,
    });
  };

  // Processes the engines move from the worker
  useEffect(() => {
    worker.onmessage = (e) => {
      const { move } = e.data;
      processMove(move.from, move.to, move.promotion);
    };
  }, []);

  // Runs the engine move after the user makes a move
  useEffect(() => {
    if (currPlayer !== userSide && !isGameOver && userSide !== null) {
      getEngineMove(5, 5000);
    }
  }, [currPlayer, userSide]);

  return (
    <div className="body">
      <div className="gameWrap">
        <BitboardBoard
          bitboards={displayedBitboards}
          onSquareClick={handleSquareClick}
          selectedSquare={selectedSquare}
          userSide={userSide}
          moveBitboard={moveBitboard}
        />
        {promotion && (
          <PromotionModal
            onPromote={handlePromotion}
            square={promotionMove.to}
            userPlayer={userSide}
          />
        )}
        <Sidebar
          currPlayer={currPlayer}
          resetGame={resetGame}
          isGameOver={isGameOver}
          result={result}
          pastMoves={pastMoves}
          changeBoardView={changeBoardView}
          indexOfViewedMove={currIndexOfDisplayed}
        />
      </div>
      {isModalOpen && (
        <Modal
          isGameHistory={isGameHistoryMenuOpen}
          isBattle={isBattleEnginesOpen}
          battleEngines={battleTwoEngines}
        />
      )}
    </div>
  );
};

export default BitboardGame;
