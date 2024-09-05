import Board from "./Board";
import { initializeBoard } from "../utils/chessLogic";
import { useState } from "react";
import { isValidMoveWithCheck, isGameOver } from "../utils/chessLogic";
import PromotionModal from "./PromotionModal";
import Sidebar from "./Sidebar";
import "./UI.css"

const Game = () => {
  const [board, setBoard] = useState(initializeBoard());
  const [boards, setBoards] = useState([initializeBoard()]);
  const [currPlayer, setCurrPlayer] = useState("w");
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const [gameState, setGameState] = useState({
    enPassant: null,
    kingMoved: { w: false, b: false },
    rookMoved: {
      w: {
        kingside: false,
        queenside: false,
      },
      b: {
        kingside: false,
        queenside: false,
      },
    },
    kingPosition: { w: [7, 4], b: [0, 4] },
    gameOver: false,
    gameEndState: 'none',
  });

  const handleSquareClick = (row, col) => {
    console.log(gameState.gameOver)
    if (gameState.gameOver) return;
    
    setPromotion(null);
    setSelectedPiece(null);
    // Update selected piece instantly when clicking pieces of the same color so you dont have to double click to deselect then select
    const target = board[row][col];
    if (
      currPlayer === "w" &&
      target !== "-" &&
      target === target.toUpperCase()
    ) {
      setSelectedPiece([row, col]);
      return;
    }
    if (
      currPlayer === "b" &&
      target !== "-" &&
      target === target.toLowerCase()
    ) {
      setSelectedPiece([row, col]);
      return;
    }

    if (selectedPiece) {
      const [selectedRow, selectedCol] = selectedPiece;
      if (
        isValidMoveWithCheck(
          board,
          selectedRow,
          selectedCol,
          row,
          col,
          currPlayer,
          gameState
        )
      ) {
        const newBoard = [...board];
        const piece = board[selectedRow][selectedCol];

        // Check for promotion
        if (piece.toLowerCase() === "p" && (row === 0 || row === 7)) {
          setPromotion({
            from: [selectedRow, selectedCol],
            to: [row, col],
          });
          return;
        }

        // Handle en passant capture
        if (
          piece.toLowerCase() === "p" &&
          Math.abs(selectedRow - row) === 1 &&
          Math.abs(selectedCol - col) === 1 &&
          board[row][col] === "-"
        ) {
          const enPassantRow = currPlayer === "w" ? row + 1 : row - 1;
          newBoard[enPassantRow][col] = "-";
        }

        // Handle castling
        if (piece.toLowerCase() === "k" && Math.abs(selectedCol - col) === 2) {
          const rookStartCol = col > selectedCol ? 7 : 0;
          const rookEndCol = col > selectedCol ? col - 1 : col + 1;

          newBoard[row][rookEndCol] = newBoard[row][rookStartCol];
          newBoard[row][rookStartCol] = "-";
          newBoard[row][col] = newBoard[selectedRow][selectedCol];
          newBoard[selectedRow][selectedCol] = "-";

          const side = col > selectedCol ? "kingside" : "queenside";
          setGameState({
            ...gameState,
            kingMoved: { ...gameState.kingMoved, [currPlayer]: true },
            rookMoved: {
              ...gameState.rookMoved,
              [currPlayer]: {
                ...gameState.rookMoved[currPlayer],
                [side]: true,
              },
            },
          });
        } else {
          newBoard[row][col] = newBoard[selectedRow][selectedCol];
          newBoard[selectedRow][selectedCol] = "-";
        }

        if (piece.toLowerCase() === "p" && Math.abs(selectedRow - row) === 2) {
          const enPassantRow = currPlayer === "w" ? row + 1 : row - 1;
          // Multiplying row by 8 then adding the col creates a unique identifier number for each square
          setGameState({ ...gameState, enPassant: enPassantRow * 8 + col });
        } else {
          setGameState({ ...gameState, enPassant: null });
        }
        // Updates king position
        if (piece.toLowerCase() === "k") {
          setGameState({
            ...gameState,
            kingPosition: {
              ...gameState.kingPosition,
              [currPlayer]: [row, col],
            },
            kingMoved: { ...gameState.kingMoved, [currPlayer]: true },
          });
        }

        const deepCopy = newBoard.map(row => [...row]);
        console.log(isGameOver(board, currPlayer, gameState, [...boards, deepCopy]))
        if (isGameOver(board, currPlayer, gameState, [...boards, deepCopy]) !== 'none') {
          setGameState({...gameState, gameOver: true, gameEndState: isGameOver(board, currPlayer, gameState, boards)})
        }

        setBoards([...boards, deepCopy])
        setBoard(newBoard);
        setCurrPlayer(currPlayer === "w" ? "b" : "w");
      }

      setSelectedPiece(null);
    } else {
      const piece = board[row][col];
      if (
        piece !== "-" &&
        ((currPlayer === "b" && piece === piece.toLowerCase()) ||
          (currPlayer === "w" && piece === piece.toUpperCase()))
      ) {
        setSelectedPiece([row, col]);
      }
    }

  };

  const handlePromotion = (newPiece) => {
    const { from, to } = promotion;
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    const newBoard = [...board];

    newBoard[fromRow][fromCol] = "-";
    newBoard[toRow][toCol] = newPiece;

    setBoard(newBoard);
    setPromotion(null);
    setSelectedPiece(null);
    setCurrPlayer(currPlayer === "w" ? "b" : "w");
  };

  const resetGame = () => {
    setBoard(initializeBoard());
    setBoards([initializeBoard()]);
    setCurrPlayer('w');
    setPromotion(null);
    setSelectedPiece(null);
    setGameState({
      enPassant: null,
      kingMoved: { w: false, b: false },
      rookMoved: {
        w: {
          kingside: false,
          queenside: false,
        },
        b: {
          kingside: false,
          queenside: false,
        },
      },
      kingPosition: { w: [7, 4], b: [0, 4] },
      gameOver: false,
      gameEndState: 'none',
    })
  }

  return (
    <div className="body">
      <Board
        board={board}
        onSquareClick={handleSquareClick}
        selectedPiece={selectedPiece}
      />
      {promotion && (
        <PromotionModal onPromote={handlePromotion} currPlayer={currPlayer} />
      )}
      <Sidebar currPlayer={currPlayer} resetGame={resetGame} gameStatus={gameState.gameEndState} gameOver={gameState.gameOver}/>
    </div>
  );
};

export default Game;
