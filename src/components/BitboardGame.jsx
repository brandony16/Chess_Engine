import { useEffect, useState } from "react";
import PromotionModal from "./PromotionModal";
import Sidebar from "./Sidebar";
import {
  checkGameOver,
  filterIllegalMoves,
  isValidMove,
  makeMove,
  updateCastlingRights,
} from "./bitboardUtils/bbChessLogic";
import {
  computeHash,
  getPieceAtSquare,
  initialBitboards,
  isPlayersPieceAtSquare,
  moveToReadable,
  pieceSymbols,
} from "./bitboardUtils/bbHelpers";
import "./UI.css";
import BitboardBoard from "./BitboardBoard";
import { getPieceMoves } from "./bitboardUtils/bbMoveGeneration";
import { getBestMove } from "./bbEngines/BondMonkeyV1";

// Runs the game
const BitboardGame = () => {
  // STATES
  const [bitboards, setBitboards] = useState(initialBitboards);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [moveBitboard, setMoveBitboard] = useState(null);
  const [currPlayer, setCurrPlayer] = useState("w");
  const [userSide, setUserSide] = useState("w");
  const [enPassantSquare, setEnPassantSquare] = useState(null);
  const [promotion, setPromotion] = useState(false);
  const [promotionMove, setPromotionMove] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [result, setResult] = useState(null);
  const [pastPositions, setPastPositions] = useState(new Map());
  const [pastMoves, setPastMoves] = useState([]);
  const [castlingRights, setCastlingRights] = useState({
    whiteKingside: true,
    whiteQueenside: true,
    blackKingside: true,
    blackQueenside: true,
  });

  // FUNCTIONS

  // Gets the engine move then plays it
  const makeEngineMove = () => {
    const bestMoveObj = getBestMove(bitboards, currPlayer, castlingRights, enPassantSquare);
    const from = bestMoveObj.from;
    const to = bestMoveObj.to;
    const promotion = bestMoveObj.promotion;

    const moveObj = makeMove(
      bitboards,
      from,
      to,
      enPassantSquare,
      promotion
    );
    const newBitboards = moveObj.bitboards;

    const hash = computeHash(
      newBitboards,
      currPlayer,
      moveObj.enPassantSquare
    );

    const gameOverObj = checkGameOver(
      newBitboards,
      currPlayer,
      pastPositions,
      castlingRights,
      moveObj.enPassantSquare
    );

    const readableMove = moveToReadable(
      newBitboards,
      from,
      to,
      moveObj.isCapture,
      promotion
    );

    updateStates(readableMove, moveObj, newBitboards, hash, gameOverObj);
  };

  // Handles when a square is clicked
  const handleSquareClick = (row, col) => {
    if (isGameOver) return;

    const square = row * 8 + col;
    if (isPlayersPieceAtSquare(currPlayer, square, bitboards)) {
      setSelectedSquare(square);
      const piece = getPieceAtSquare(square, bitboards);
      const moveBitboard = getPieceMoves(
        bitboards,
        pieceSymbols[piece],
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
      setMoveBitboard(filteredMoveBitboard);
      setPromotion(false);
      setPromotionMove(null);
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
        if (
          (row === 7 || row === 0) &&
          pieceSymbols[
            getPieceAtSquare(selectedSquare, bitboards)
          ].toLowerCase() === "p"
        ) {
          setPromotion(true);
          setPromotionMove({ from: selectedSquare, to: square });
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
          moveObj.enPassantSquare
        );

        const gameOverObj = checkGameOver(
          newBitboards,
          currPlayer,
          pastPositions,
          castlingRights,
          moveObj.enPassantSquare
        );

        const readableMove = moveToReadable(
          newBitboards,
          selectedSquare,
          square,
          moveObj.isCapture
        );

        updateStates(readableMove, moveObj, newBitboards, hash, gameOverObj);
      } else {
        setSelectedSquare(null);
        setMoveBitboard(null);
        setPromotion(false);
        setPromotionMove(null);
      }
    }
  };

  const handlePromotion = (piece) => {
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
      moveObj.enPassantSquare
    );

    const moveNotation = moveToReadable(
      newBitboards,
      from,
      to,
      moveObj.isCapture,
      piece
    );

    updateStates(moveNotation, moveObj, newBitboards, hash, gameOverObj);
    setPromotion(false);
    setPromotionMove(null);
  };

  const updateStates = (
    moveNotation,
    moveObj,
    newBitboards,
    hash,
    gameOverObj
  ) => {
    setIsGameOver(gameOverObj.isGameOver);
    setResult(gameOverObj.result);
    setPastMoves((pastMoves) => [...pastMoves, moveNotation]);
    setEnPassantSquare(moveObj.enPassantSquare);
    setCastlingRights(updateCastlingRights(selectedSquare, castlingRights));
    setSelectedSquare(null);
    setBitboards(newBitboards);
    setCurrPlayer((prev) => (prev === "w" ? "b" : "w"));
    setMoveBitboard(null);
    setPastPositions((prevPositions) => {
      const newPositions = new Map(prevPositions);
      newPositions.set(hash, (newPositions.get(hash) || 0) + 1);
      return newPositions;
    });
  };

  // Resets the game
  const resetGame = () => {
    setUserSide((prev) => (prev === "w" ? "b" : "w"));
    setBitboards(initialBitboards);
    setSelectedSquare(null);
    setCurrPlayer("w");
    setEnPassantSquare(null);
    setIsGameOver(false);
    setMoveBitboard(null);
    setPastPositions(new Map());
    setPastMoves([]);
    setPromotion(false);
    setPromotionMove(null);
    setCastlingRights({
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    });
  };

  // Runs the engine move after the user makes a move
  useEffect(() => {
    if (currPlayer !== userSide && !isGameOver) {
      setTimeout(() => {
        makeEngineMove();
      }, 0);
    }
  }, [currPlayer, userSide]);

  return (
    <div className="body">
      
      <BitboardBoard
        bitboards={bitboards}
        onSquareClick={handleSquareClick}
        selectedSquare={selectedSquare}
        userSide={userSide}
        moveBitboard={moveBitboard}
      />
      {promotion && (
        <PromotionModal
          onPromote={handlePromotion}
          currPlayer={currPlayer}
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
      />
    </div>
  );
};

export default BitboardGame;
