import { useEffect, useMemo } from "react";
import PromotionModal from "./modals/PromotionModal";
import Sidebar from "./sidebar/Sidebar";
import "./UI.css";
import BitboardBoard from "./boardComponents/BitboardBoard";
import { makeMove } from "./bitboardUtils/moveMaking/makeMoveLogic";
import { computeHash } from "./bitboardUtils/zobristHashing";
import { checkGameOver } from "./bitboardUtils/gameOverLogic";
import { movesToBB, moveToReadable } from "./bitboardUtils/generalHelpers";
import { isPlayersPieceAtSquare, pieceAt } from "./bitboardUtils/pieceGetters";
import { getAllLegalMoves } from "./bitboardUtils/moveGeneration/allMoveGeneration";
import { getNewEnPassant } from "./bitboardUtils/bbChessLogic";
import { useGameStore } from "./gameStore";
import Modal from "./modals/Modal";
import { BLACK_PAWN, WHITE_PAWN } from "./bitboardUtils/constants";
import Move from "./bitboardUtils/moveMaking/move";
import { isKing } from "./bitboardUtils/bbUtils";
import {
  getOpeningMoves,
  squareToIndex,
} from "./bitboardUtils/FENandUCIHelpers";
import { updateAttackMasks } from "./bitboardUtils/PieceMasks/attackMask";

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
    updateAttackMasks(bitboards, move);

    const newEnPassant = getNewEnPassant(move);
    const epFile = newEnPassant ? newEnPassant % 8 : -1;

    const hash = computeHash(bitboards, currPlayer, epFile, castlingRights);

    const newPositions = new Map(pastPositions);
    newPositions.set(hash, (newPositions.get(hash) || 0) + 1);

    const gameOverObj = checkGameOver(
      bitboards,
      currPlayer,
      newPositions,
      newEnPassant,
      fiftyMoveRuleCounter
    );

    const readableMove = moveToReadable(
      bitboards,
      from,
      to,
      move.captured !== null
    );

    updateStates(readableMove, move, hash, gameOverObj);
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

  const playRandomOpening = async () => {
    // Fetches an 8ply opening from openings.json
    const moves = await getOpeningMoves();

    for (const uciMove of moves) {
      const from = squareToIndex(uciMove.slice(0, 2));
      const to = squareToIndex(uciMove.slice(2, 4));
      const promotion = null; // Cant have a promotion in 4 moves

      processMove(from, to, promotion);
    }
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
  const battleTwoEngines = async (engine1, engine2, games = 10, depth = 3) => {
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
      await playRandomOpening();

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
