import { useEffect, useState } from "react";
import PromotionModal from "./PromotionModal";
import Sidebar from "./Sidebar";
import { isValidMove, makeMove, updateCastlingRights } from "./bitboardUtils/bbChessLogic";
import {
  getPieceAtSquare,
  initialBitboards,
  isPlayersPieceAtSquare,
  pieceSymbols,
} from "./bitboardUtils/bbHelpers";
import "./UI.css";
import BitboardBoard from "./BitboardBoard";

// Runs the game
const BitboardGame = () => {
  // STATES
  const [bitboards, setBitboards] = useState(initialBitboards);
  const [selectedSquare, setselectedSquare] = useState(null);
  const [currPlayer, setCurrPlayer] = useState("w");
  const [userSide, setUserSide] = useState("w");
  const [enPassantSquare, setEnPassantSquare] = useState(null);
  const [castlingRights, setCastlingRights] = useState({
    whiteKingside: true,
    whiteQueenside: true,
    blackKingside: true,
    blackQueenside: true,
  });

  // FUNCTIONS

  // Gets the engine move then plays it
  const makeEngineMove = () => {};

  // Handles when a square is clicked
  const handleSquareClick = (row, col) => {
    const square = row * 8 + col;

    if (isPlayersPieceAtSquare(currPlayer, square, bitboards)) {
      setselectedSquare(square);
      return;
    }

    if (selectedSquare !== null) {
      if (isValidMove(bitboards, selectedSquare, square, currPlayer, enPassantSquare, castlingRights)) {
        const moveObj = makeMove(bitboards, selectedSquare, square, enPassantSquare);
        const newBitboards = moveObj.bitboards;
        
        setEnPassantSquare(moveObj.enPassantSquare);
        setCastlingRights(updateCastlingRights(selectedSquare, castlingRights))
        setselectedSquare(null);
        setBitboards(newBitboards);
        setCurrPlayer((prev) => (prev === "w" ? "b" : "w"));
      }
    }
  };

  // Resets the game
  const resetGame = () => {
    setUserSide((prev) => (prev === "w" ? "b" : "w"));
    setBitboards(initialBitboards);
    setselectedSquare(null);
    setCurrPlayer("w");
    setCastlingRights({
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    })
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
        selectedSquare={selectedSquare}
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
