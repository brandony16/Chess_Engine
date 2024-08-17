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

export function isValidMove(board, startRow, startCol, endRow, endCol, player) {
  const piece = board[startRow][startCol];
  const target = board[endRow][endCol];

  // Prevent moving to piece of same color
  if (player === "w" && target !== "-" && target === target.toUpperCase())
    return false;
  if (player === "b" && target !== "-" && target === target.toLowerCase())
    return false;

  switch (piece.toLowerCase()) {
    case "p": {
      const direction = player === "w" ? -1 : 1; // White moves up (-1), Black moves down (+1)
      const startRowForPlayer = player === "w" ? 6 : 1; // Starting row for white or black pawn

      // Move forward 1 square
      if (
        startRow + direction === endRow &&
        startCol === endCol &&
        target === "-"
      ) {
        return true;
      }

      // Move forward 2 squares on the first move
      if (
        startRow === startRowForPlayer &&
        startRow + 2 * direction === endRow &&
        startCol === endCol
      ) {
        // Ensure the path is clear
        if (board[startRow + direction][startCol] === "-" && target === "-") {
          return true;
        }
      }

      // Capture diagonally
      if (
        startRow + direction === endRow &&
        Math.abs(startCol - endCol) === 1 &&
        target !== "-"
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
      if(rowDiff <= 1 && colDiff <= 1) {
        return true
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
