import { useEffect, useMemo } from "react";
import PromotionModal from "./modals/PromotionModal";
import Sidebar from "./sidebar/Sidebar";
import "./UI.css";
import BitboardBoard from "./boardComponents/BitboardBoard";
import { getCachedAttackMask } from "./bitboardUtils/PieceMasks/attackMask";
import {
  isValidMove,
  makeMove,
} from "./bitboardUtils/moveMaking/makeMoveLogic";
import { computeHash } from "./bitboardUtils/zobristHashing";
import { checkGameOver } from "./bitboardUtils/gameOverLogic";
import { moveToReadable } from "./bitboardUtils/generalHelpers";
import {
  getPieceAtSquare,
  isPlayersPieceAtSquare,
} from "./bitboardUtils/pieceGetters";
import { getPieceMoves } from "./bitboardUtils/moveGeneration/allMoveGeneration";
import { filterIllegalMoves } from "./bitboardUtils/bbChessLogic";
import { useGameStore } from "./gameStore";
import Modal from "./modals/Modal";

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

  const worker = useMemo(() => {
    return new Worker(new URL("./bbEngines/engineWorker.js", import.meta.url), {
      type: "module",
    });
  }, []);
  // FUNCTIONS
  // Gets the engine move then plays it
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

    const bestMoveObj = engine(
      bitboards,
      currPlayer,
      castlingRights,
      enPassantSquare,
      pastPositions,
      depth,
      timeLimit
    );
    const from = bestMoveObj.from;
    const to = bestMoveObj.to;
    const promotion = bestMoveObj.promotion;

    processMove(from, to, promotion);
  };

  const processMove = (from, to, promotion) => {
    const {
      bitboards,
      currPlayer,
      castlingRights,
      enPassantSquare,
      pastPositions,
      updateStates,
      fiftyMoveRuleCounter,
    } = useGameStore.getState();

    const moveObj = makeMove(bitboards, from, to, enPassantSquare, promotion);
    const newBitboards = moveObj.bitboards;

    const hash = computeHash(
      newBitboards,
      currPlayer,
      moveObj.enPassantSquare,
      castlingRights
    );

    const gameOverObj = checkGameOver(
      newBitboards,
      currPlayer,
      pastPositions,
      castlingRights,
      moveObj.enPassantSquare,
      fiftyMoveRuleCounter
    );

    const readableMove = moveToReadable(
      newBitboards,
      from,
      to,
      moveObj.isCapture,
      promotion
    );

    updateStates(readableMove, moveObj, newBitboards, hash, gameOverObj, from);
  };

  // Handles when a square is clicked
  const handleSquareClick = (row, col) => {
    const {
      isCurrPositionShown,
      isGameOver,
      bitboards,
      currPlayer,
      castlingRights,
      enPassantSquare,
      pastPositions,
      updateStates,
      userSide,
      selectedSquare,
      fiftyMoveRuleCounter,
    } = useGameStore.getState();
    if (isGameOver || !isCurrPositionShown || userSide !== currPlayer) return;

    const square = row * 8 + col;
    if (isPlayersPieceAtSquare(currPlayer, square, bitboards)) {
      useGameStore.setState({ selectedSquare: square });
      const piece = getPieceAtSquare(square, bitboards);

      const moveBitboard = getPieceMoves(
        bitboards,
        piece > 5 ? piece - 6 : piece,
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
        if ((row === 7 || row === 0) && (piece === 0 || piece === 6)) {
          useGameStore.setState({
            promotion: true,
            promotionMove: { from: selectedSquare, to: square },
          });
          return;
        }

        const moveObj = makeMove(
          bitboards,
          selectedSquare,
          square,
          enPassantSquare
        );
        const newBitboards = moveObj.bitboards;

        const hash = computeHash(
          newBitboards,
          currPlayer,
          moveObj.enPassantSquare,
          castlingRights
        );

        const gameOverObj = checkGameOver(
          newBitboards,
          currPlayer,
          pastPositions,
          castlingRights,
          moveObj.enPassantSquare,
          fiftyMoveRuleCounter
        );

        const readableMove = moveToReadable(
          newBitboards,
          selectedSquare,
          square,
          moveObj.isCapture
        );
        // Ensures the attack map cache has the new attack map
        getCachedAttackMask(newBitboards, currPlayer);

        updateStates(
          readableMove,
          moveObj,
          newBitboards,
          hash,
          gameOverObj,
          selectedSquare
        );
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

  const handlePromotion = (piece) => {
    const {
      bitboards,
      currPlayer,
      castlingRights,
      enPassantSquare,
      pastPositions,
      updateStates,
      promotionMove,
      fiftyMoveRuleCounter,
    } = useGameStore.getState();

    const from = promotionMove.from;
    const to = promotionMove.to;

    const moveObj = makeMove(bitboards, from, to, enPassantSquare, piece);
    const newBitboards = moveObj.bitboards;

    const hash = computeHash(newBitboards, currPlayer, moveObj.enPassantSquare);

    const gameOverObj = checkGameOver(
      newBitboards,
      currPlayer,
      pastPositions,
      castlingRights,
      moveObj.enPassantSquare,
      fiftyMoveRuleCounter
    );

    const moveNotation = moveToReadable(
      newBitboards,
      from,
      to,
      moveObj.isCapture,
      piece
    );
    getCachedAttackMask(newBitboards, currPlayer);
    updateStates(moveNotation, moveObj, newBitboards, hash, gameOverObj, from);
    useGameStore.setState({
      promotion: false,
      promotionMove: null,
    });
  };

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
