import { getLegalMoves } from "../../utils/pieceMoves";

// V2: Plays moves purely based on material
export const getBestMove = (board, player, gameState, depth) => {
  const moves = getLegalMoves(board, player, gameState);

  let bestMove = null;
  let bestEval = player === "w" ? -Infinity : Infinity;

  for (const move of moves) {
    const [fromRow, fromCol] = move[0];
    const [toRow, toCol] = move[1];

    const newBoard = board.map((row) => [...row]);

    // Simulate Move
    newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
    newBoard[fromRow][fromCol] = "-";

    const moveEval = minimax(
      newBoard,
      depth - 1,
      player,
      gameState
    );

    if (
      (player === "w" && moveEval > bestEval) || // Maximizing player
      (player === "b" && moveEval < bestEval)    // Minimizing player
    ) {
      bestEval = moveEval;
      bestMove = move;
    }
  }

  return bestMove;
};

const minimax = (board, depth, player, gameState) => {
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

      // Simulate the move
      const newBoard = board.map((row) => [...row]);
      newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
      newBoard[fromRow][fromCol] = "-";

      // Recursively call the minimax function
      const currEval = minimax(newBoard, depth - 1, "b", gameState);

      maxEval = Math.max(maxEval, currEval);
    }
    return maxEval;
  } else {
    // Black tries to minimize the evaluation
    let minEval = Infinity;

    for (const move of moves) {
      const [fromRow, fromCol] = move[0];
      const [toRow, toCol] = move[1];

      // Simluate Move
      const newBoard = board.map((row) => [...row]);
      newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
      newBoard[fromRow][fromCol] = "-";

      const currEval = minimax(newBoard, depth - 1, "w", gameState);

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
