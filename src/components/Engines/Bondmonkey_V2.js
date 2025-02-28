import { updateGameState } from "../../utils/chessLogic";
import { getLegalMoves } from "../../utils/pieceMoves";

// V2: Plays moves purely based on material
export const getBestMove = (board, player, gameState, depth, boards) => {
  const moves = getLegalMoves(board, player, gameState);

  let bestMove = null;
  let bestEval = player === "w" ? -Infinity : Infinity;

  for (const move of moves) {
    const [fromRow, fromCol] = move[0];
    const [toRow, toCol] = move[1];
    let simGameState = { ...gameState };
    let simBoards = [ ...boards ];

    const newBoard = board.map((row) => [...row]);

    // Simulate Move
    newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
    newBoard[fromRow][fromCol] = "-";

    // If castling, need to move the rook
    if (
      newBoard[toRow][toCol].toLowerCase() === "k" &&
      Math.abs(fromCol, toCol) === 2
    ) {
      // fromCol is bigger when castling queenside
      if (fromCol - toCol == 2) {
        newBoard[fromRow][3] = newBoard[fromRow][0];
        newBoard[fromRow][0] = "-";
      } else {
        newBoard[fromRow][5] = newBoard[fromRow][7];
        newBoard[fromRow][7] = "-";
      }
    }

    // If en passant, need to remove the captured pawn
    if (
      newBoard[toRow][toCol].toLowerCase() === "p" &&
      gameState.enPassant &&
      toRow * 8 + toCol
    ) {
      let direction = player === "w" ? 1 : -1;

      newBoard[toRow + direction][toCol] = "-";
    }

    // UPDATE GAME STATE
    simGameState = updateGameState(
      board,
      fromRow,
      fromCol,
      toRow,
      toCol,
      player,
      simGameState,
      simBoards
    );
    simBoards = [ ...simBoards, newBoard.map(row => [...row]) ];

    const moveEval = minimax(
      newBoard,
      depth - 1,
      player,
      simGameState,
      simBoards
    );

    if (
      (player === "w" && moveEval > bestEval) ||
      (player === "b" && moveEval < bestEval)
    ) {
      bestEval = moveEval;
      bestMove = move;
    }
  }

  return bestMove;
};

const minimax = (board, depth, player, gameState, boards) => {
  // Break conditions. Stops searching if the depth is reached or if the game is over
  if (depth === 0 || gameState.gameOver) {
    return evaluatePosition(board);
  }

  const moves = getLegalMoves(board, player, gameState);
  if (player === "w") {
    // White tries to maximize the evaluation
    let maxEval = -Infinity;

    for (const move of moves) {
      const [fromRow, fromCol] = move[0];
      const [toRow, toCol] = move[1];
      let simGameState = { ...gameState };
      let simBoards = [ ...boards ];

      // Simulate the move
      const newBoard = board.map((row) => [...row]);
      newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
      newBoard[fromRow][fromCol] = "-";

      // If castling, need to move the rook
      if (
        newBoard[toRow][toCol].toLowerCase() === "k" &&
        Math.abs(fromCol, toCol) === 2
      ) {
        // fromCol is bigger when castling queenside
        if (fromCol - toCol == 2) {
          newBoard[fromRow][3] = newBoard[fromRow][0];
          newBoard[fromRow][0] = "-";
        } else {
          newBoard[fromRow][5] = newBoard[fromRow][7];
          newBoard[fromRow][7] = "-";
        }
      }

      // If en passant, need to remove the captured pawn
      if (
        newBoard[toRow][toCol].toLowerCase() === "p" &&
        simGameState.enPassant &&
        toRow * 8 + toCol
      ) {
        let direction = player === "w" ? 1 : -1;

        newBoard[toRow + direction][toCol] = "-";
      }

      // UDPATE GAME STATE
      gameState = updateGameState(
        newBoard,
        fromRow,
        fromCol,
        toRow,
        toCol,
        player,
        simGameState,
        boards
      );
      simBoards = [ ...simBoards, newBoard.map(row => [...row]) ];

      const currEval = minimax(newBoard, depth - 1, "b", simGameState);

      maxEval = Math.max(maxEval, currEval);
    }
    return maxEval;
  } else {
    // Black tries to minimize the evaluation
    let minEval = Infinity;

    for (const move of moves) {
      const [fromRow, fromCol] = move[0];
      const [toRow, toCol] = move[1];
      let simGameState = { ...gameState };
      let simBoards = [ ...boards ];

      // Simluate Move
      const newBoard = board.map((row) => [...row]);
      newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
      newBoard[fromRow][fromCol] = "-";

      // If castling, need to move the rook
      if (
        newBoard[toRow][toCol].toLowerCase() === "k" &&
        Math.abs(fromCol, toCol) === 2
      ) {
        // fromCol is bigger when castling queenside
        if (fromCol - toCol == 2) {
          newBoard[fromRow][3] = newBoard[fromRow][0];
          newBoard[fromRow][0] = "-";
        } else {
          newBoard[fromRow][5] = newBoard[fromRow][7];
          newBoard[fromRow][7] = "-";
        }
      }

      // If en passant, need to remove the captured pawn
      if (
        newBoard[toRow][toCol].toLowerCase() === "p" &&
        simGameState.enPassant &&
        toRow * 8 + toCol
      ) {
        let direction = player === "w" ? 1 : -1;

        newBoard[toRow + direction][toCol] = "-";
      }

      // UPDATE GAME STATE
      simGameState = updateGameState(
        newBoard,
        fromRow,
        fromCol,
        toRow,
        toCol,
        player,
        simGameState,
        simBoards
      );
      simBoards = [ ...simBoards, newBoard.map(row => [...row]) ];

      const currEval = minimax(newBoard, depth - 1, "w", simGameState);

      minEval = Math.min(minEval, currEval);
    }
    return minEval;
  }
};

// Piece wieghts
const weights = {
  p: -1,
  n: -3,
  b: -3,
  r: -5,
  q: -9,
  k: -1000000,
  P: 1,
  N: 3,
  B: 3,
  R: 5,
  Q: 9,
  K: 1000000,
};

const evaluatePosition = (board) => {
  let evaluation = 0;

  for (const row of board) {
    for (const cell of row) {
      if (cell != "-") {
        evaluation += weights[cell];
      }
    }
  }

  return evaluation;
};
