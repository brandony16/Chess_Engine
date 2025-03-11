import { simulateMove, sortMoves, updateGameState } from "../../utils/chessLogic";
import { getLegalMoves } from "../../utils/pieceMoves";


// V2: Plays moves purely based on material
export const getBestMove = (board, player, gameState, depth, boards) => {
  const moves = getLegalMoves(board, player, gameState);
  const sortedMoves = sortMoves(board, moves);

  let bestMove = null;
  let bestEval = player === "w" ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of sortedMoves) {
    let newBoard = simulateMove(board, move);
    let simGameState = { ...gameState };
    let simBoards = [...boards];
    
    const [fromRow, fromCol] = move[0];
    const [toRow, toCol] = move[1];

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
    simBoards = [...simBoards, newBoard.map((row) => [...row])];

    const moveEval = minimax(
      newBoard,
      depth - 1,
      player === "w" ? "b" : "w",
      simGameState,
      simBoards,
      alpha,
      beta
    );

    if (
      (player === "w" && moveEval > bestEval) ||
      (player === "b" && moveEval < bestEval)
    ) {
      bestEval = moveEval;
      bestMove = move;
    }

    if (player === "w") {
      alpha = Math.max(alpha, moveEval);
    } else {
      beta = Math.min(beta, moveEval);
    }

    if (beta <= alpha) {
      break;
    }
  }

  return bestMove;
};

const minimax = (board, depth, player, gameState, boards, alpha, beta) => {
  // Break conditions. Stops searching if the depth is reached or if the game is over
  if (depth === 0 || gameState.gameOver) {
    return evaluatePosition(board, player, gameState);
  }

  const moves = getLegalMoves(board, player, gameState);
  const sortedMoves = sortMoves(board, moves);

  if (player === "w") {
    // White tries to maximize the evaluation
    let maxEval = -Infinity;

    for (const move of sortedMoves) {
      let newBoard = simulateMove(board, move);
      let simGameState = { ...gameState };
      let simBoards = [...boards];
      
      const [fromRow, fromCol] = move[0];
      const [toRow, toCol] = move[1];

      // UDPATE GAME STATE
      simGameState = updateGameState(
        newBoard,
        fromRow,
        fromCol,
        toRow,
        toCol,
        player,
        simGameState,
        boards
      );
      simBoards = [...simBoards, newBoard.map((row) => [...row])];

      const currEval = minimax(newBoard, depth - 1, "b", simGameState, simBoards, alpha, beta);


      maxEval = Math.max(maxEval, currEval);
      alpha = Math.max(alpha, currEval);

      if (beta <= alpha) {
        break;
      }
    }
    return maxEval;
  } else {
    // Black tries to minimize the evaluation
    let minEval = Infinity;

    for (const move of moves) {
      let newBoard = simulateMove(board, move);
      let simGameState = { ...gameState };
      let simBoards = [...boards];
      
      const [fromRow, fromCol] = move[0];
      const [toRow, toCol] = move[1];

      // UDPATE GAME STATE
      simGameState = updateGameState(
        newBoard,
        fromRow,
        fromCol,
        toRow,
        toCol,
        player,
        simGameState,
        boards
      );
      simBoards = [...simBoards, newBoard.map((row) => [...row])];

      const currEval = minimax(newBoard, depth - 1, "b", simGameState, simBoards, alpha, beta);

      minEval = Math.min(minEval, currEval);
      beta = Math.min(beta, currEval);

      if (beta <= alpha) {
        break;
      }
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

const evaluatePosition = (board, player, gameState) => {
  if (player === 'w' && gameState.gameEndState === 'checkmate') {
    return -Infinity;
  } else if (player === 'b' && gameState.gameEndState === 'checkmate') {
    return Infinity;
  }
  
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
