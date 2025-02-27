import Board from "./Board";
import { initializeBoard } from "../utils/chessLogic";
import { useEffect, useState } from "react";
import { isValidMoveWithCheck, isGameOver } from "../utils/chessLogic";
import { getBestMove } from "./Engines/Bondmonkey_V2";
import PromotionModal from "./PromotionModal";
import Sidebar from "./Sidebar";
import "./UI.css";

// Runs the game
const Game = () => {
  // STATES
  const [board, setBoard] = useState(initializeBoard());
  const [boards, setBoards] = useState([initializeBoard()]); 
  const [currPlayer, setCurrPlayer] = useState("w");
  const [userSide, setUserSide] = useState("w");
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
    gameEndState: "none",
  });

  // FUNCTIONS

  // Gets the engine move then plays it
  const makeEngineMove = () => {
    const bestMove = getBestMove(board, currPlayer, gameState, 2);

    const [fromRow, fromCol] = bestMove[0];
    const [toRow, toCol] = bestMove[1];

    const newBoard = [...board];
    newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
    newBoard[fromRow][fromCol] = "-";

    const piece = newBoard[toRow][toCol];

    // If castling, need to move the rook
    if (piece.toLowerCase() === 'k' && Math.abs(fromCol, toCol) === 2) {
      // fromCol is bigger when castling queenside
      if (fromCol - toCol == 2) {
        board[fromRow][3] = board[fromRow][0];
        board[fromRow][0] = '-';
      } else {
        board[fromRow][5] = board[fromRow][7];
        board[fromRow][7] = '-';
      }
    }

    // If en passant, need to remove the captured pawn
    if (piece.toLowerCase() === 'p' && gameState.enPassant && (toRow*8 + toCol)) {
      let direction = currPlayer === 'w' ? 1 : -1;

      board[toRow + direction][toCol] = '-';
    }

    // UPDATE GAME STATE
    // Updates En Passant
    if (piece.toLowerCase() === "p" && Math.abs(toRow - fromRow) === 2) {
      const enPassantRow = currPlayer === "w" ? toRow + 1 : toRow - 1;
      // Multiplying row by 8 then adding the col creates a unique identifier number for each square
      setGameState({ ...gameState, enPassant: enPassantRow * 8 + toCol });
    } else {
      setGameState({ ...gameState, enPassant: null });
    }
    // Updates king position
    if (piece.toLowerCase() === "k") {
      setGameState({
        ...gameState,
        kingPosition: {
          ...gameState.kingPosition,
          [currPlayer]: [toRow, toCol],
        },
        kingMoved: { ...gameState.kingMoved, [currPlayer]: true },
      });
    }
    // Udates game state if castling
    if (piece.toLowerCase() === "k" && Math.abs(toCol - fromCol) === 2) {
      const side = toCol > fromCol ? "kingside" : "queenside";
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
    }
    // Update if rook moved from starting square for black
    if (piece === "r") {
      if (fromRow === 0 && fromCol === 0) {
        setGameState({
          ...gameState,
          rookMoved: {
            ...gameState.rookMoved,
            b: { ...gameState.rookMoved.b, queenside: true },
          },
        });
      }
      if (fromRow === 0 && fromCol === 7) {
        setGameState({
          ...gameState,
          rookMoved: {
            ...gameState.rookMoved,
            b: { ...gameState.rookMoved.b, kingside: true },
          },
        });
      }
    }
    // Update if rook moved from starting square for white
    if (piece === "R") {
      if (fromRow === 7 && fromCol === 0) {
        setGameState({
          ...gameState,
          rookMoved: {
            ...gameState.rookMoved,
            w: { ...gameState.rookMoved.w, queenside: true },
          },
        });
      }
      if (fromRow === 7 && fromCol === 7) {
        setGameState({
          ...gameState,
          rookMoved: {
            ...gameState.rookMoved,
            w: { ...gameState.rookMoved.w, kingside: true },
          },
        });
      }
    }
    // Check if game is over and updates state if it is
    const deepCopy = newBoard.map((row) => [...row]);
    if (
      isGameOver(board, currPlayer, gameState, [...boards, deepCopy]) !== "none"
    ) {
      setGameState({
        ...gameState,
        gameOver: true,
        gameEndState: isGameOver(board, currPlayer, gameState, boards),
      });
    }

    setBoard(newBoard);
    setCurrPlayer(currPlayer === "w" ? "b" : "w");
  };

  // Handles when a square is clicked
  const handleSquareClick = (row, col) => {
    if (gameState.gameOver) return;

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
    
    // If a piece is selected, move there if legal
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
        
        // If castling, set corresponding board, else move normally
        if (piece.toLowerCase() === "k" && Math.abs(selectedCol - col) === 2) {
          handleCastle(newBoard, row, col, selectedRow, selectedCol);
        } else {
          newBoard[row][col] = newBoard[selectedRow][selectedCol];
          newBoard[selectedRow][selectedCol] = "-";
        }

        // Remove enemy piece if en passant capture
        if (
          piece.toLowerCase() === "p" &&
          Math.abs(selectedRow - row) === 1 &&
          Math.abs(selectedCol - col) === 1 &&
          board[row][col] === "-"
        ) {
          const enPassantRow = currPlayer === "w" ? row + 1 : row - 1;
          newBoard[enPassantRow][col] = "-";
        }

        // Sets en passant row if pawn moves 2 squares, clears en passant row if it doesn't
        if (piece.toLowerCase() === "p" && Math.abs(selectedRow - row) === 2) {
          const enPassantRow = currPlayer === "w" ? row + 1 : row - 1;
          // Multiplying row by 8 then adding the col creates a unique identifier number for each square
          setGameState({ ...gameState, enPassant: enPassantRow * 8 + col });
        } else {
          setGameState({ ...gameState, enPassant: null });
        }

        // Updates king position if king moved
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

        // Update state if game is over
        const deepCopy = newBoard.map((row) => [...row]);
        if (
          isGameOver(board, currPlayer, gameState, [...boards, deepCopy]) !==
          "none"
        ) {
          setGameState({
            ...gameState,
            gameOver: true,
            gameEndState: isGameOver(board, currPlayer, gameState, boards),
          });
        }
        
        // Update states
        setBoards([...boards, deepCopy]);
        setBoard(newBoard);
        setCurrPlayer(currPlayer === "w" ? "b" : "w");
      }

      // If not a valid move, deselect the piece
      setSelectedPiece(null);
    } else {
      const piece = board[row][col];
      // Selects the piece if no piece is selected
      if (
        piece !== "-" &&
        ((currPlayer === "b" && piece === piece.toLowerCase()) ||
          (currPlayer === "w" && piece === piece.toUpperCase()))
      ) {
        setSelectedPiece([row, col]);
      }
    }
  };

  // Handles a promoting pawn
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

  // Resets the game
  const resetGame = () => {
    setBoard(initializeBoard());
    setBoards([initializeBoard()]);
    setCurrPlayer("w");
    setUserSide(userSide === "w" ? "b" : "w");
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
      gameEndState: "none",
    });
  };

  // Handles castling
  const handleCastle = (newBoard, row, col, selectedRow, selectedCol) => {
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
  }

  // Runs the engine move after the user makes a move
  useEffect(() => {
    if (currPlayer !== userSide && !gameState.gameOver) {
      makeEngineMove();
    }
  }, [currPlayer, userSide, gameState, board])

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
      <Sidebar
        currPlayer={currPlayer}
        resetGame={resetGame}
        gameStatus={gameState.gameEndState}
        gameOver={gameState.gameOver}
      />
    </div>
  );
};

export default Game;
