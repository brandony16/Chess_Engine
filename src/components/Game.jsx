import Board from "./Board";
import { initializeBoard } from "../utils/chessLogic";
import { useState } from "react";
import { isValidMove } from "../utils/chessLogic";

const Game = () => {
  const [board, setBoard] = useState(initializeBoard());
  const [currPlayer, setCurrPlayer] = useState("w");
  const [selectedPiece, setSelectedPiece] = useState(null);
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
  });

  const handleSquareClick = (row, col) => {
    if (selectedPiece) {
      const [selectedRow, selectedCol] = selectedPiece;

      if (
        isValidMove(
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

        // Handle en passant capture
        if (
          piece.toLowerCase() === "p" &&
          Math.abs(selectedRow - row) === 1 &&
          Math.abs(selectedCol - col) === 1 &&
          board[row][col] === "-"
        ) {
          // Capture the pawn that's being taken en passant
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
          newBoard[selectedRow][selectedCol] = '-'

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
          console.log(enPassantRow);
          // Multiplying row by 8 then adding the col creates a unique identifier number for each square
          setGameState({ ...gameState, enPassant: enPassantRow * 8 + col });
        } else {
          setGameState({ ...gameState, enPassant: null });
        }

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

  return <Board board={board} onSquareClick={handleSquareClick} />;
};

export default Game;
