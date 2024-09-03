export function initializeBoard() {
  return [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["-", "-", "-", "-", "-", "-", "-", "-"],
    ["-", "-", "-", "-", "-", "-", "-", "-"],
    ["-", "-", "-", "-", "-", "-", "-", "-"],
    ["-", "-", "-", "-", "-", "-", "-", "-"],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"],
  ];
}

export function isValidMove(
  board,
  startRow,
  startCol,
  endRow,
  endCol,
  player,
  gameState
) {
  const piece = board[startRow][startCol];
  const target = board[endRow][endCol];

  // Prevent moving to piece of same color
  if (player === "w" && target !== "-" && target === target.toUpperCase())
    return false;
  if (player === "b" && target !== "-" && target === target.toLowerCase())
    return false;

  switch (piece.toLowerCase()) {
    case "p": {
      const direction = player === "w" ? -1 : 1;
      const startRowForPlayer = player === "w" ? 6 : 1;

      if (
        startRow + direction === endRow &&
        startCol === endCol &&
        target === "-"
      ) {
        return true;
      }

      if (
        startRow === startRowForPlayer &&
        startRow + 2 * direction === endRow &&
        startCol === endCol
      ) {
        if (board[startRow + direction][startCol] === "-" && target === "-") {
          return true;
        }
      }

      if (
        startRow + direction === endRow &&
        Math.abs(startCol - endCol) === 1 &&
        target !== "-"
      ) {
        return true;
      }

      if (
        startRow + direction === endRow &&
        Math.abs(startCol - endCol) === 1 &&
        target === "-" && 
        gameState.enPassant === endRow * 8 + endCol
      ) {
        return true;
      }
      break;
    }
    case "r": {
      if (startRow === endRow || startCol === endCol) {
        if (pathIsClear(board, startRow, startCol, endRow, endCol)) {
          return true;
        }
      }
      break;
    }
    case "n": {
      const rowDiff = Math.abs(startRow - endRow);
      const colDiff = Math.abs(startCol - endCol);

      if (
        (rowDiff === 2 && colDiff === 1) ||
        (rowDiff === 1 && colDiff === 2)
      ) {
        return true;
      }
      break;
    }
    case "b": {
      const rowDiff = Math.abs(startRow - endRow);
      const colDiff = Math.abs(startCol - endCol);

      if (
        rowDiff === colDiff &&
        diagIsClear(board, startRow, startCol, endRow, endCol)
      ) {
        return true;
      }
      break;
    }
    case "q": {
      if (startRow === endRow || startCol === endCol) {
        if (pathIsClear(board, startRow, startCol, endRow, endCol)) {
          return true;
        }
      }
      const rowDiff = Math.abs(startRow - endRow);
      const colDiff = Math.abs(startCol - endCol);

      if (
        rowDiff === colDiff &&
        diagIsClear(board, startRow, startCol, endRow, endCol)
      ) {
        return true;
      }
      break;
    }
    case "k": {
      const rowDiff = Math.abs(startRow - endRow);
      const colDiff = Math.abs(startCol - endCol);
      if (rowDiff <= 1 && colDiff <= 1) {
        return true;
      }

      if (rowDiff === 0 && colDiff === 2) {
        const kingSide = endCol > startCol ? "kingside" : "queenside";
        if (isCastlingLegal(board, player, gameState, kingSide)) {
          return true;
        }
      }
    }
  }
}

const pathIsClear = (board, startRow, startCol, endRow, endCol) => {
  if (startRow === endRow) {
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    for (let col = minCol + 1; col < maxCol; col++) {
      if (board[startRow][col] !== "-") {
        return false;
      }
    }
  }
  if (startCol === endCol) {
    const maxRow = Math.max(startRow, endRow);
    const minRow = Math.min(startRow, endRow);

    for (let row = minRow + 1; row < maxRow; row++) {
      if (board[row][startCol] !== "-") {
        return false;
      }
    }
  }

  return true;
};

const diagIsClear = (board, startRow, startCol, endRow, endCol) => {
  if (Math.abs(endRow - startRow) !== Math.abs(endCol - startCol)) {
    return false;
  }

  const rowDirection = endRow > startRow ? 1 : -1;
  const colDirection = endCol > startCol ? 1 : -1;

  let currentRow = startRow + rowDirection;
  let currentCol = startCol + colDirection;

  while (currentRow !== endRow && currentCol !== endCol) {
    if (board[currentRow][currentCol] !== "-") {
      return false;
    }
    currentRow += rowDirection;
    currentCol += colDirection;
  }

  return true;
};

function isCastlingLegal(board, player, gameState, side) {
  const kingRow = player === "w" ? 7 : 0;
  const rookCol = side === "kingside" ? 7 : 0;
  const kingCol = 4;

  // Check if the king or the corresponding rook has moved
  if (gameState.kingMoved[player]) return false;
  if (gameState.rookMoved[player][side]) return false;

  // Ensure there are no pieces between the king and the rook
  const colStart = Math.min(kingCol, rookCol) + 1;
  const colEnd = Math.max(kingCol, rookCol) - 1;
  for (let col = colStart; col <= colEnd; col++) {
    if (board[kingRow][col] !== "-") return false;
  }

  // Check if the squares the king passes through, including the destination, are under attack
  const kingDestCol = side === "kingside" ? 6 : 2;
  if (
    isSquareUnderAttack(board, kingRow, kingCol, player) ||
    isSquareUnderAttack(
      board,
      kingRow,
      kingCol + (kingDestCol - kingCol) / 2,
      player
    ) ||
    isSquareUnderAttack(board, kingRow, kingDestCol, player)
  ) {
    return false;
  }

  return true;
}

function isSquareUnderAttack(board, endRow, endCol, player) {
  const otherPlayer = player === 'w' ? 'b' : 'w'

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];

      if (
        piece != "-" &&
        (player === "w"
          ? piece === piece.toLowerCase()
          : piece === piece.toUpperCase())
      ) {
        // See if opponent can move to the square
        if (isValidMove(board, row, col, endRow, endCol, otherPlayer)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function isInCheck(board, kingPosition, player, gameState) {
  const [kingRow, kingCol] = kingPosition;
  const otherPlayer = player === 'w' ? 'b' : 'w'

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];

      if (
        piece != "-" &&
        (player === "w"
          ? piece === piece.toLowerCase()
          : piece === piece.toUpperCase())
      ) {
        // See if opponent can move to take the king
        if (isValidMove(board, row, col, kingRow, kingCol, otherPlayer, gameState)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function isValidMoveWithCheck(
  board,
  startRow,
  startCol,
  endRow,
  endCol,
  player,
  gameState
) {
  // Copy board
  const boardCopy = JSON.parse(JSON.stringify(board));
  // Simulate move
  boardCopy[endRow][endCol] = boardCopy[startRow][startCol];
  boardCopy[startRow][startCol] = "-";

  const piece = board[startRow][startCol];

  const newKingPosition =
    piece.toLowerCase() === "k"
      ? [endRow, endCol]
      : gameState.kingPosition[player];
  return (
    !isInCheck(boardCopy, newKingPosition, player, gameState) &&
    isValidMove(board, startRow, startCol, endRow, endCol, player, gameState)
  );
}

export function mateOrStalemate(board, player, gameState) {
  const kingPosition = gameState.kingPosition[player];
  const inCheck = isInCheck(board, kingPosition, player);

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (
        (piece !== "-" && player === "w" && piece === piece.toUpperCase()) ||
        (player === "b" && piece === piece.toLowerCase())
      ) {
        for (let newRow = 0; newRow < 8; newRow++) {
          for (let newCol = 0; newCol < 8; newCol++) {
            if (
              isValidMoveWithCheck(
                board,
                row,
                col,
                newRow,
                newCol,
                player,
                gameState
              )
            ) {
              return "none";
            }
          }
        }
      }
    }
  }
  return inCheck ? "checkmate" : "stalemate";
};
