import { useEffect, useState } from "react";
import PromotionModal from "./PromotionModal";
import Sidebar from "./Sidebar";
import { isValidMove, makeMove } from "./bitboardUtils/bbChessLogic";
import {
  initialBitboards,
  isPlayersPieceAtSquare,
} from "./bitboardUtils/bbHelpers";
import "./UI.css";
import BitboardBoard from "./BitboardBoard";

// Runs the game
const BitboardGame = () => {
  // STATES
  const [bitboards, setBitboards] = useState(initialBitboards);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [currPlayer, setCurrPlayer] = useState("w");
  const [userSide, setUserSide] = useState("w");

  // FUNCTIONS

  // Gets the engine move then plays it
  const makeEngineMove = () => {};

  // Handles when a square is clicked
  const handleSquareClick = (row, col) => {
    const square = row * 8 + col;

    if (isPlayersPieceAtSquare(currPlayer, square, bitboards)) {
      setSelectedPiece(square);
      return;
    }

    if (selectedPiece !== null) {
      if (isValidMove(bitboards, selectedPiece, square, currPlayer)) {
        const newBitboards = makeMove(bitboards, selectedPiece, square);
        setSelectedPiece(null);
        setBitboards(newBitboards);
        setCurrPlayer((prev) => (prev === "w" ? "b" : "w"));
      }
    }
  };
  // Resets the game
  const resetGame = () => {
    setUserSide((prev) => (prev === "w" ? "b" : "w"));
    setBitboards(initialBitboards);
  };

  // Runs the engine move after the user makes a move
  useEffect(() => {
    // if (currPlayer !== userSide && !gameState.gameOver) {
    //   setTimeout(() => {
    //     makeEngineMove();
    //   }, 0);
    // }
  }, [currPlayer, userSide]);

  return (
    <div className="body">
      <BitboardBoard
        bitboards={bitboards}
        onSquareClick={handleSquareClick}
        selectedPiece={selectedPiece}
        userSide={userSide}
      />
      {/* {promotion && (
        <PromotionModal onPromote={handlePromotion} currPlayer={currPlayer} />
      )} */}
      <Sidebar
        currPlayer={currPlayer}
        resetGame={resetGame}
        gameStatus={"none"}
        gameOver={false}
      />
    </div>
  );
};

export default BitboardGame;
