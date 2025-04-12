import { useEffect, useState } from "react";
import PromotionModal from "./PromotionModal";
import Sidebar from "./Sidebar";
import "./UI.css";
import BitboardBoard from "./BitboardBoard";
import { getBestMoveBMV1 } from "./bbEngines/BondMonkeyV1";
import { getBestMoveBMV2 } from "./bbEngines/BondMonkeyV2";
import { getCachedAttackMask } from "./bitboardUtils/PieceMasks/attackMask";
import { INITIAL_BITBOARDS, PIECE_SYMBOLS } from "./bitboardUtils/constants";
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
import { updateCastlingRights } from "./bitboardUtils/moveMaking/castleMoveLogic";

// Runs the game
const BitboardGame = () => {
  // STATES
  const [bitboards, setBitboards] = useState(INITIAL_BITBOARDS);
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
  const [pastBitboards, setPastBitboards] = useState([]);
  const [displayedBitboards, setDisplayedBitboards] =
    useState(INITIAL_BITBOARDS);
  const [isCurrPositionShown, setIsCurrPositionShown] = useState(true);
  const [currIndexOfDisplayed, setCurrIndexOfDisplayed] = useState(-1);
  const [castlingRights, setCastlingRights] = useState({
    whiteKingside: true,
    whiteQueenside: true,
    blackKingside: true,
    blackQueenside: true,
  });

  // FUNCTIONS

  // Gets the engine move then plays it
  const makeEngineMove = () => {
    if (!isCurrPositionShown || isGameOver) return;

    const bestMoveObj = getBestMoveBMV2(
      bitboards,
      currPlayer,
      castlingRights,
      enPassantSquare,
      pastPositions,
      4
    );
    const from = bestMoveObj.from;
    const to = bestMoveObj.to;
    const promotion = bestMoveObj.promotion;

    const moveObj = makeMove(bitboards, from, to, enPassantSquare, promotion);
    const newBitboards = moveObj.bitboards;

    const hash = computeHash(newBitboards, currPlayer, moveObj.enPassantSquare);

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
    if (isGameOver || !isCurrPositionShown || userSide !== currPlayer) return;

    const square = row * 8 + col;
    if (isPlayersPieceAtSquare(currPlayer, square, bitboards)) {
      setSelectedSquare(square);
      const piece = getPieceAtSquare(square, bitboards);
      const moveBitboard = getPieceMoves(
        bitboards,
        PIECE_SYMBOLS[piece],
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
          PIECE_SYMBOLS[
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
        getCachedAttackMask(newBitboards, currPlayer);

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
    getCachedAttackMask(newBitboards, currPlayer);
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
    setMoveBitboard(null);
    setPastPositions((prevPositions) => {
      const newPositions = new Map(prevPositions);
      newPositions.set(hash, (newPositions.get(hash) || 0) + 1);
      return newPositions;
    });

    // Board display
    setPastBitboards((prevBoards) => [...prevBoards, newBitboards]);
    setDisplayedBitboards(newBitboards);
    setCurrIndexOfDisplayed((prev) => prev + 1);
    setCurrPlayer((prev) => (prev === "w" ? "b" : "w"));
  };

  // Resets the game
  const resetGame = () => {
    setUserSide((prev) => (prev === "w" ? "b" : "w"));
    setBitboards(INITIAL_BITBOARDS);
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

  // Allows user to look at past moves
  const changeBoardView = (direction) => {
    const index = currIndexOfDisplayed + direction;

    if (index < 0 || index >= pastBitboards.length) return;

    setDisplayedBitboards(pastBitboards[index]);
    setCurrIndexOfDisplayed((prev) => prev + direction);

    if (index === pastBitboards.length - 1) {
      setIsCurrPositionShown(true);
    } else {
      setIsCurrPositionShown(false);
      setSelectedSquare(null);
      setMoveBitboard(null);
    }
  };

  // Runs the engine move after the user makes a move
  useEffect(() => {
    if (currPlayer !== userSide && !isGameOver) {
      setTimeout(() => {
        makeEngineMove();
      }, 10);
    }
  }, [currPlayer, userSide]);

  return (
    <div className="body">
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
  );
};

export default BitboardGame;
