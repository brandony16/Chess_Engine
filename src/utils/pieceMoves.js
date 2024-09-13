export const getPawnMoves = (board, row, col, player) => {
  const direction = player === "w" ? -1 : 1;

  const moves = [];

  // Move 1 square
  if (board[row + direction][col] === "-") {
    moves.append([row + direction, col]);
  }

  // Move 2 squares
  if ((player === "w" && row === 7) || (player == "b" && row === 1)) {
    // Check if pawn is on starting rank and if both squares in front of pawn are clear
    if (
      board[row + direction][col] === "-" &&
      board[row + direction * 2][col] === "-"
    ) {
      moves.append([row + direction * 2, col]);
    }
  }

  // Capture
  // CURRENTLY WILL BREAK IF PAWN ON EDGE OF BOARD
  const rightSquare = board[row + direction][col + 1]
  if (rightSquare !== '-') {
    if (player === 'w') {
      if (rightSquare === rightSquare.toLowerCase()) {
        moves.append([row+direction, col+1])
      }
    }
    if (player === 'b') {
      if (rightSquare === rightSquare.toUpperCase()) {
        moves.append([row+direction, col+1])
      }
    }
  }

  const leftSquare = board[row + direction][col - 1]
  if (leftSquare !== '-') {
    if (player === 'w') {
      if (leftSquare === leftSquare.toLowerCase()) {
        moves.append([row+direction, col-1])
      }
    }
    if (player === 'b') {
      if (leftSquare === leftSquare.toUpperCase()) {
        moves.append([row+direction, col-1])
      }
    }
  } 

  // IMPLEMENT EN PASSANT LOGIC
};

export const getRookMoves = (board, row, col) => {
  const directions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];
  const moves = [];

  for (const dir in directions) {
    // Add dir[0] & dir[1] to not include starting square
    let currRow = row + dir[0];
    let currCol = col + dir[1];

    while (
      0 <= currRow < 8 &&
      0 <= currCol < 8 &&
      board[currRow][currCol] === "-"
    ) {
      moves.append([currRow, currCol]);

      currRow += dir[0];
      currCol += dir[1];
    }
  }

  return moves;
};

export const getKnightmoves = (board, row, col) => {
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

  for (const move in baseMoves) {
    const newRow = row + move[0];
    const newCol = col + move[1];

    if (0 <= newRow < 8 && 0 <= newCol < 8 && board[newRow][newCol] === "-") {
      moves.append([newRow, newCol]);
    }
  }

  return moves;
};

export const getBishopMoves = (board, row, col) => {
  const directions = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];

  const moves = [];

  for (const dir in directions) {
    // Add dir[0] & dir[1] to not include starting square
    let currRow = row + dir[0];
    let currCol = col + dir[1];

    while (
      0 <= currRow < 8 &&
      0 <= currCol < 8 &&
      board[currRow][currCol] === "-"
    ) {
      moves.append([currRow, currCol]);

      currRow += dir[0];
      currCol += dir[1];
    }
  }

  return moves;
};

export const getQueenMoves = (board, row, col) => {
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

  for (const dir in directions) {
    // Add dir[0] & dir[1] to not include starting square
    let currRow = row + dir[0];
    let currCol = col + dir[1];

    while (
      0 <= currRow < 8 &&
      0 <= currCol < 8 &&
      board[currRow][currCol] === "-"
    ) {
      moves.append([currRow, currCol]);

      currRow += dir[0];
      currCol += dir[1];
    }
  }

  return moves;
};

export const getKingMoves = (
  board,
  row,
  col,
  canCastleKing,
  canCastleQueen
) => {
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

  for (const move in baseMoves) {
    const newRow = row + move[0];
    const newCol = col + move[1];

    if (0 <= newRow < 8 && 0 <= newCol < 8 && board[newRow][newCol] === "-") {
      moves.append([newRow, newCol]);
    }
  }

  if (canCastleKing) {
    moves.append([row, col + 2]);
  }
  if (canCastleQueen) {
    moves.append([row, col - 2]);
  }

  return moves;
};
