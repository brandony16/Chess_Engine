// Get moves for individual pieces
const getPawnMoves = (board, row, col, player, gameState) => {
  const direction = player === "w" ? -1 : 1;

  const moves = [];

  // Move 1 square
  if (board[row + direction][col] === "-") {
    moves.push([
      [row, col],
      [row + direction, col],
    ]);
  }

  // Move 2 squares
  if ((player === "w" && row === 6) || (player == "b" && row === 1)) {
    // Check if pawn is on starting rank and if both squares in front of pawn are clear
    if (
      board[row + direction][col] === "-" &&
      board[row + (direction * 2)][col] === "-"
    ) {
      moves.push([
        [row, col],
        [row + direction * 2, col],
      ]);
    }
  }

  // Capture
  // Only proceed if the col is between 0 and 7
  if (col + 1 <= 7) {
    const rightSquare = board[row + direction][col + 1];
    if (rightSquare !== "-") {
      if (player === "w") {
        if (rightSquare === rightSquare.toLowerCase()) {
          moves.push([
            [row, col],
            [row + direction, col + 1],
          ]);
        }
      }
      if (player === "b") {
        if (rightSquare === rightSquare.toUpperCase()) {
          moves.push([
            [row, col],
            [row + direction, col + 1],
          ]);
        }
      }
    }
  }
  if (col - 1 >= 0) {
    const leftSquare = board[row + direction][col - 1];
    if (leftSquare !== "-") {
      if (player === "w") {
        if (leftSquare === leftSquare.toLowerCase()) {
          moves.push([
            [row, col],
            [row + direction, col - 1],
          ]);
        }
      }
      if (player === "b") {
        if (leftSquare === leftSquare.toUpperCase()) {
          moves.push([
            [row, col],
            [row + direction, col - 1],
          ]);
        }
      }
    }
  }

  // En Passant
  if (gameState.enPassant) {
    const enPassantRow = Math.floor(gameState.enPassant / 8);
    const enPassantCol = gameState.enPassant % 8;

    if (Math.abs(col - enPassantCol) === 1) {
      if (player === 'w' && (row - enPassantRow) === -1) {
        moves.push([[row, col], [enPassantRow, enPassantCol]]);
      }
      if (player === 'b' && (row - enPassantRow) === 1) {
        moves.push([[row, col], [enPassantRow, enPassantCol]]);
      }
    }
  }

  return moves;
};

const getRookMoves = (board, row, col) => {
  const directions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];
  const moves = [];

  for (const dir of directions) {
    // Add dir[0] & dir[1] to not include starting square
    let currRow = row + dir[0];
    let currCol = col + dir[1];
    while (
      currRow >= 0 &&
      currRow < 8 &&
      currCol >= 0 &&
      currCol < 8 &&
      board[currRow][currCol] === "-"
    ) {
      moves.push([
        [row, col],
        [currRow, currCol],
      ]);

      currRow += dir[0];
      currCol += dir[1];

    }
  }
  return moves;
};

const getKnightMoves = (board, row, col) => {
  // Knight can move 2 in one direction and 1 in the other in and way. These moves repesent that
  const baseMoves = [
    [2, 1],
    [2, -1],
    [1, 2],
    [-1, 2],
    [-2, 1],
    [-2, -1],
    [1, -2],
    [-1, -2],
  ];
  const moves = [];

  for (const move of baseMoves) {
    const newRow = row + move[0];
    const newCol = col + move[1];

    if (
      0 <= newRow &&
      newRow < 8 &&
      0 <= newCol &&
      newCol < 8 &&
      board[newRow][newCol] === "-"
    ) {
      moves.push([
        [row, col],
        [newRow, newCol],
      ]);
    }
  }

  return moves;
};

const getBishopMoves = (board, row, col) => {
  const directions = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];

  const moves = [];

  for (const dir of directions) {
    // Add dir[0] & dir[1] to not include starting square
    let currRow = row + dir[0];
    let currCol = col + dir[1];

    while (
      0 <= currRow &&
      currRow < 8 &&
      0 <= currCol &&
      currCol < 8 &&
      board[currRow][currCol] === "-"
    ) {
      moves.push([
        [row, col],
        [currRow, currCol],
      ]);

      currRow += dir[0];
      currCol += dir[1];
    }
  }

  return moves;
};

const getQueenMoves = (board, row, col) => {
  const directions = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];

  const moves = [];

  for (const dir of directions) {
    // Add dir[0] & dir[1] to not include starting square
    let currRow = row + dir[0];
    let currCol = col + dir[1];

    while (
      0 <= currRow &&
      currRow < 8 &&
      0 <= currCol &&
      currCol < 8 &&
      board[currRow][currCol] === "-"
    ) {
      moves.push([
        [row, col],
        [currRow, currCol],
      ]);

      currRow += dir[0];
      currCol += dir[1];
    }
  }

  return moves;
};

import { isCastlingLegal } from "./chessLogic";

const getKingMoves = (board, row, col, player, gameState) => {
  const baseMoves = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];

  const moves = [];

  for (const move of baseMoves) {
    const newRow = row + move[0];
    const newCol = col + move[1];

    if (
      0 <= newRow &&
      newRow < 8 &&
      0 <= newCol &&
      newCol < 8 &&
      board[newRow][newCol] === "-"
    ) {
      moves.push([
        [row, col],
        [newRow, newCol],
      ]);
    }
  }

  if (isCastlingLegal(board, player, gameState, "kingside")) {
    moves.push([
      [row, col],
      [row, col + 2],
    ]);
  }
  if (isCastlingLegal(board, player, gameState, "queenside")) {
    moves.push([
      [row, col],
      [row, col - 2],
    ]);
  }

  return moves;
};

// Get all moves of individual pieces. Dont need king because you can only have one.
const getAllPawnMoves = (board, player, gameState) => {
  let moves = [];
  const piece = player === "w" ? "P" : "p";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === piece) {
        moves = [...moves, ...getPawnMoves(board, r, c, player, gameState)];
      }
    }
  }

  return moves;
};
const getAllRookMoves = (board, player) => {
  let moves = [];
  const piece = player === "w" ? "R" : "r";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === piece) {
        moves = [...moves, ...getRookMoves(board, r, c, player)];
      }
    }
  }

  return moves;
};
const getAllKightMoves = (board, player) => {
  let moves = [];
  const piece = player === "w" ? "N" : "n";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === piece) {
        moves = [...moves, ...getKnightMoves(board, r, c)];
      }
    }
  }

  return moves;
};
const getAllBishopMoves = (board, player) => {
  let moves = [];
  const piece = player === "w" ? "B" : "b";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === piece) {
        moves = [...moves, ...getBishopMoves(board, r, c)];
      }
    }
  }

  return moves;
};
const getAllQueenMoves = (board, player) => {
  let moves = [];
  const piece = player === "w" ? "Q" : "q";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === piece) {
        moves = [...moves, ...getQueenMoves(board, r, c)];
      }
    }
  }

  return moves;
};

import { isValidMoveWithCheck } from "./chessLogic";

export const getLegalMoves = (board, player, gameState) => {
  // Determine where the king is
  const [kingRow, kingCol] = gameState.kingPosition[player];

  // Get all moves
  const pawnMoves = getAllPawnMoves(board, player, gameState);
  const rookMoves = getAllRookMoves(board, player);
  const knightMoves = getAllKightMoves(board, player);
  const bishopMoves = getAllBishopMoves(board, player);
  const queenMoves = getAllQueenMoves(board, player);
  const kingMoves = getKingMoves(board, kingRow, kingCol, player, gameState);

///*
  console.log(player + ' moves: ')
  console.log("Pawn Moves: ")
  console.log(pawnMoves)
  console.log("Rook Moves: ")
  console.log(rookMoves)
  console.log("Knight Moves: ")
  console.log(knightMoves)
  console.log("Bishop Moves: ")
  console.log(bishopMoves)
  console.log("Queen Moves: ")
  console.log(queenMoves)
  console.log("King Moves: ")
  console.log(kingMoves)
//*/  
  
  // Combine all moves into one array
  const allMoves = [
    ...pawnMoves,
    ...rookMoves,
    ...knightMoves,
    ...bishopMoves,
    ...queenMoves,
    ...kingMoves,
  ];

  // Filter out invalid moves. Mainly those that put the king in check
  const validMoves = allMoves.filter(move =>
    isValidMoveWithCheck(
      board,
      move[0][0], // Start row
      move[0][1], // Start col
      move[1][0], // End row
      move[1][1], // End col
      player,
      gameState
    )
  );

  return validMoves;
};
