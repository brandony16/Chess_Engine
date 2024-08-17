import Board from "./Board";
import { initializeBoard } from "../utils/chessLogic";
import { useState } from "react";
import { isValidMove } from "../utils/chessLogic";

const Game = () => {
  const [board, setBoard] = useState(initializeBoard());
  const [currPlayer, setCurrPlayer] = useState("w");
  const [selectedPiece, setSelectedPiece] = useState(null);

  const handleSquareClick = (row, col) => {
    const piece = board[row][col];

    if (selectedPiece) {
      const [selectedRow, selectedCol] = selectedPiece;

      if (isValidMove(board, selectedRow, selectedCol, row, col, currPlayer)) {
        const newBoard = [...board];
        newBoard[row][col] = newBoard[selectedRow][selectedCol];
        newBoard[selectedRow][selectedCol] = "-";

        setBoard(newBoard);

        setCurrPlayer(currPlayer === "w" ? "b" : "w");
      }

      setSelectedPiece(null);
    } else {
      console.log(piece);
      if (
        piece !== "-" &&
        ((currPlayer === "b" && piece === piece.toLowerCase()) ||
          (currPlayer === "w" && piece === piece.toUpperCase()))
      ) {
        console.log(`${piece} selected`);
        setSelectedPiece([row, col]);
      }
    }
  };

  return <Board board={board} onSquareClick={handleSquareClick} />;
};

export default Game;
