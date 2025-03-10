import { getLegalMoves } from "./pieceMoves";

export function initializeBoard() {
  return [
    ["r", "n", "b", "q", "k", "b", "n", "r"], // 0
    ["p", "p", "p", "p", "p", "p", "p", "p"], // 1
    ["-", "-", "-", "-", "-", "-", "-", "-"], // 2
    ["-", "-", "-", "-", "-", "-", "-", "-"], // 3
    ["-", "-", "-", "-", "-", "-", "-", "-"], // 4
    ["-", "-", "-", "-", "-", "-", "-", "-"], // 5
    ["P", "P", "P", "P", "P", "P", "P", "P"], // 6
    ["R", "N", "B", "Q", "K", "B", "N", "R"], // 7
    //0    1    2    3    4    5    6    7
  ];
}

// Determines whether a move is valid
export function isValidMove(
  board,
  startRow,
  startCol,
  endRow,
  endCol,
  player,
  gameState
) {
  if (
    startRow < 0 ||
    startRow > 7 ||
    startCol < 0 ||
    startCol > 7 ||
    endCol < 0 ||
    endCol > 7 ||
    endRow < 0 ||
    endRow > 7
  ) {
    return false;
  }

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

      // Move pawn 1 square forward
      if (
        startRow + direction === endRow &&
        startCol === endCol &&
        target === "-"
      ) {
        return true;
      }

      // Move pawn 2 squares forward
      if (
        startRow === startRowForPlayer &&
        startRow + 2 * direction === endRow &&
        startCol === endCol
      ) {
        if (board[startRow + direction][startCol] === "-" && target === "-") {
          return true;
        }
      }

      // Capture a piece
      if (
        startRow + direction === endRow &&
        Math.abs(startCol - endCol) === 1 &&
        target !== "-"
      ) {
        return true;
      }

      // En Passant capture
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
      if (diagIsClear(board, startRow, startCol, endRow, endCol)) {
        return true;
      }
      break;
    }
    case "q": {
      // Moving horizontally or vertically
      if (startRow === endRow || startCol === endCol) {
        if (pathIsClear(board, startRow, startCol, endRow, endCol)) {
          return true;
        }
      }

      // Moving Diagonally
      if (diagIsClear(board, startRow, startCol, endRow, endCol)) {
        return true;
      }
      break;
    }
    case "k": {
      const rowDiff = Math.abs(startRow - endRow);
      const colDiff = Math.abs(startCol - endCol);

      // Moving one square
      if (rowDiff <= 1 && colDiff <= 1) {
        return true;
      }

      // Castling
      if (rowDiff === 0 && colDiff === 2) {
        if (gameState.kingMoved[player]) return false;

        // Determine which side we are castling then see if it is legal
        const kingSide = endCol > startCol ? "kingside" : "queenside";
        if (isCastlingLegal(board, player, gameState, kingSide)) {
          return true;
        }
      }
      return false;
    }
  }
  return false;
}

// Determines whether a straignt path from a starting square to an ending square is free of pieces
export const pathIsClear = (board, startRow, startCol, endRow, endCol) => {
  // Moving horizontally
  if (startRow === endRow) {
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    for (let col = minCol + 1; col < maxCol; col++) {
      if (board[startRow][col] !== "-") {
        return false;
      }
    }
  }

  // Moving vertically
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

// Determines whether a diagonal from the start square to the end square is clear
export const diagIsClear = (board, startRow, startCol, endRow, endCol) => {
  // Not a diagonal
  if (Math.abs(endRow - startRow) !== Math.abs(endCol - startCol)) {
    return false;
  }

  const rowDirection = endRow > startRow ? 1 : -1;
  const colDirection = endCol > startCol ? 1 : -1;

  let currentRow = startRow + rowDirection;
  let currentCol = startCol + colDirection;

  // Loop until you reach the end square. Don't check the end square
  while (currentRow !== endRow && currentCol !== endCol) {
    if (board[currentRow][currentCol] !== "-") {
      return false;
    }
    currentRow += rowDirection;
    currentCol += colDirection;
  }

  return true;
};

// Determines whether castling is legal
export function isCastlingLegal(board, player, gameState, side) {
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
    isSquareUnderAttack(board, kingRow, kingCol, player, gameState) ||
    isSquareUnderAttack(
      board,
      kingRow,
      kingCol + (kingDestCol - kingCol) / 2,
      player,
      gameState
    ) ||
    isSquareUnderAttack(board, kingRow, kingDestCol, player, gameState)
  ) {
    return false;
  }

  return true;
}

// Determines whether a square is under attack. Used for checking castling legality
export function isSquareUnderAttack(board, endRow, endCol, player, gameState) {
  const otherPlayer = player === "w" ? "b" : "w";

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];

      if (
        piece != "-" &&
        (player === "w"
          ? piece === piece.toLowerCase() // Find pieces of the opposite player
          : piece === piece.toUpperCase())
      ) {
        // See if opponent can move to the square
        if (
          isValidMove(board, row, col, endRow, endCol, otherPlayer, gameState)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

// Determines whether a given king is under attack
export function isInCheck(board, player, gameState) {
  const [kingRow, kingCol] = gameState.kingPosition[player];
  const otherPlayer = player === "w" ? "b" : "w";

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];

      if (
        piece != "-" &&
        (player === "w"
          ? piece === piece.toLowerCase() // See if piece is the opposite color of the king
          : piece === piece.toUpperCase())
      ) {
        // See if opponent can move to take the king
        if (
          isValidMove(board, row, col, kingRow, kingCol, otherPlayer, gameState)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

// Determines whether a move is legal considering checks
export function isValidMoveWithCheck(
  board,
  startRow,
  startCol,
  endRow,
  endCol,
  player,
  gameState
) {
  const target = board[endRow][endCol];
  const tempState = structuredClone(gameState);

  // Prevent moving to piece of same color
  if (player === "w" && target !== "-" && target === target.toUpperCase())
    return false;
  if (player === "b" && target !== "-" && target === target.toLowerCase())
    return false;

  // Simulate move
  const newBoard = simulateMove(board, [
    [startRow, startCol],
    [endRow, endCol],
  ]);

  if (board[startRow][startCol].toLowerCase() === 'k') {
    tempState.kingPosition[player] = [endRow, endCol];
  }

  return (
    !isInCheck(newBoard, player, tempState) &&
    isValidMove(board, startRow, startCol, endRow, endCol, player, tempState)
  );
}

// Determines whether the game is over (Draw or Mate)
export function isGameOver(board, player, gameState, boards) {
  const otherPlayer = player === "w" ? "b" : "w";
  const inCheck = isInCheck(board, otherPlayer, gameState);

  if (threefoldRep(boards)) {
    return "Draw by repetition";
  }
  if (insufficientMaterial(board)) {
    return "Draw by insufficient material";
  }
  // 100 because both players moving is 1 move
  if (gameState.fiftyMoveCounter >= 100) {
    return "Draw by 50 move rule";
  }

  // Checks if the other player has a legal move. If they do, the game is not over.
  if (getLegalMoves(board, otherPlayer, gameState).length > 0) {
    return "none";
  }
  // If the opponent has no legal move and is in check, it is a checkmate.
  // If the opponent has no legal move but is not in check, it is a stalemate.
  return inCheck ? "checkmate" : "stalemate";
}

// Determines whether the same position has been reached 3 times, meaning a draw
export function threefoldRep(boards) {
  const freqMap = [];

  for (let i = 0; i < boards.length; i++) {
    let found = false;

    for (let j = 0; j < freqMap.length; j++) {
      if (boardsEqual(boards[i], freqMap[j].board)) {
        freqMap[j].count++;
        found = true;
        break;
      }
    }

    if (!found) {
      freqMap.push({ board: boards[i], count: 1 });
    }
  }
  for (let i = 0; i < freqMap.length; i++) {
    if (freqMap[i].count >= 3) {
      return true;
    }
  }

  return false;
}

// Compares two board and determines whether they have the same position
export function boardsEqual(board1, board2) {
  if (board1.length !== board2.length) return false;
  for (let i = 0; i < board1.length; i++) {
    if (board1[i].length !== board2[i].length) return false;
    for (let j = 0; j < board1[i].length; j++) {
      if (board1[i][j] !== board2[i][j]) return false;
    }
  }
  return true;
}

// Determines whether there is sufficient material to checkmate
export const insufficientMaterial = (board) => {
  let numWhitePieces = 0;
  let numBlackPieces = 0;

  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      const square = board[r][c];
      if (square !== "-" && square === square.toUpperCase()) {
        numWhitePieces++;
        if (square === "Q" || square === "R" || square === "P") {
          return false;
        }
      }
      if (square !== "-" && square === square.toLowerCase()) {
        numBlackPieces++;
        if (square === "q" || square === "r" || square === "p") {
          return false;
        }
      }
    }
  }

  // 2 because theres always the kings
  if (numWhitePieces > 2 || numBlackPieces > 2) {
    return false;
  }

  return true;
};

// Updates the game state given a board, move, player, previous state, and previous boards
export const updateGameState = (
  board,
  fromRow,
  fromCol,
  toRow,
  toCol,
  player,
  gameState,
  boards
) => {
  const piece = board[toRow][toCol];
  let newGameState = { ...gameState };

  if (piece.toLowerCase() === "p" && Math.abs(toRow - fromRow) === 2) {
    const enPassantRow = player === "w" ? toRow + 1 : toRow - 1;
    // Multiplying row by 8 then adding the col creates a unique identifier number for each square
    newGameState = { ...newGameState, enPassant: enPassantRow * 8 + toCol };
  } else {
    newGameState = { ...newGameState, enPassant: null };
  }
  // Updates king position
  if (piece.toLowerCase() === "k") {
    newGameState = {
      ...newGameState,
      kingPosition: {
        ...gameState.kingPosition,
        [player]: [toRow, toCol],
      },
      kingMoved: { ...gameState.kingMoved, [player]: true },
    };
  }
  // Udates game state if castling
  if (piece.toLowerCase() === "k" && Math.abs(toCol - fromCol) === 2) {
    const side = toCol > fromCol ? "kingside" : "queenside";
    newGameState = {
      ...newGameState,
      kingMoved: { ...newGameState.kingMoved, [player]: true },
      rookMoved: {
        ...newGameState.rookMoved,
        [player]: {
          ...newGameState.rookMoved[player],
          [side]: true,
        },
      },
    };
  }
  // Update if rook moved from starting square for black
  if (piece === "r") {
    if (fromRow === 0 && fromCol === 0) {
      newGameState = {
        ...newGameState,
        rookMoved: {
          ...newGameState.rookMoved,
          b: { ...newGameState.rookMoved.b, queenside: true },
        },
      };
    }
    if (fromRow === 0 && fromCol === 7) {
      newGameState = {
        ...newGameState,
        rookMoved: {
          ...newGameState.rookMoved,
          b: { ...newGameState.rookMoved.b, kingside: true },
        },
      };
    }
  }
  // Update if rook moved from starting square for white
  if (piece === "R") {
    if (fromRow === 7 && fromCol === 0) {
      newGameState = {
        ...newGameState,
        rookMoved: {
          ...newGameState.rookMoved,
          w: { ...newGameState.rookMoved.w, queenside: true },
        },
      };
    }
    if (fromRow === 7 && fromCol === 7) {
      newGameState = {
        ...newGameState,
        rookMoved: {
          ...newGameState.rookMoved,
          w: { ...newGameState.rookMoved.w, kingside: true },
        },
      };
    }
  }

  const thingOnPrevSquare = boards[boards.length - 1][toRow][toCol];
  if (piece.toLowerCase() !== "p" && thingOnPrevSquare === "-") {
    newGameState = {
      ...newGameState,
      fiftyMoveCounter: gameState.fiftyMoveCounter + 1,
    };
  } else {
    newGameState = {
      ...newGameState,
      fiftyMoveCounter: 0,
    };
  }

  // Check if game is over and updates state if it is
  const deepCopy = board.map((row) => [...row]);
  if (
    isGameOver(board, player, newGameState, [...boards, deepCopy]) !== "none"
  ) {
    newGameState = {
      ...newGameState,
      gameOver: true,
      gameEndState: isGameOver(board, player, newGameState, boards),
    };
  }

  return newGameState;
};

export const simulateMove = (board, move) => {
  const [fromRow, fromCol] = move[0];
  const [toRow, toCol] = move[1];

  // Simulate the move
  const newBoard = board.map((row) => [...row]);
  if (move[2]) {
    newBoard[toRow][toCol] = move[2];
  } else {
    newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
  }
  newBoard[fromRow][fromCol] = "-";

  // If castling, need to move the rook
  if (
    newBoard[toRow][toCol].toLowerCase() === "k" &&
    Math.abs(fromCol - toCol) === 2
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
    Math.abs(toRow - fromRow) === 1 &&
    Math.abs(toCol - fromCol) === 1 &&
    newBoard[toRow][toCol] === "-"
  ) {
    newBoard[fromRow][toCol] = "-";
  }

  return newBoard;
};
