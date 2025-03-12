import { boardToKey, isOnBoard } from "./helpers";
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
  gameState
) {
  if (!isOnBoard(startRow, startCol) || !isOnBoard(endRow, endCol)) {
    return false;
  }

  const piece = board[startRow][startCol];
  if (piece === "-") return false;

  const isWhite = piece === piece.toUpperCase();
  const player = isWhite ? "w" : "b";

  const target = board[endRow][endCol];

  // Prevent capturing ones own piece
  if (target !== "-") {
    const targetIsWhite = target === target.toUpperCase();
    if (isWhite === targetIsWhite) return false;
  }

  const rowDiff = endRow - startRow;
  const absRowDiff = Math.abs(rowDiff);
  const colDiff = endCol - startCol;
  const absColDiff = Math.abs(colDiff);

  switch (piece.toLowerCase()) {
    case "p": {
      const direction = isWhite ? -1 : 1;
      const startRowForPlayer = isWhite ? 6 : 1;

      // Move pawn 1 square forward
      if (rowDiff === direction && startCol === endCol && target === "-") {
        return true;
      }

      // Move pawn 2 squares forward
      if (
        startRow === startRowForPlayer &&
        rowDiff === 2 * direction &&
        startCol === endCol &&
        board[startRow + direction][startCol] === "-" &&
        target === "-"
      ) {
        return true;
      }

      // Capture a piece (including en passant check)
      if (rowDiff === direction && absColDiff === 1) {
        if (target !== "-") return true;

        if (gameState.enPassant === endRow * 8 + endCol) return true;
      }
      break;
    }
    case "r": {
      if (
        startRow === endRow ||
        (startCol === endCol &&
          pathIsClear(board, startRow, startCol, endRow, endCol))
      ) {
        return true;
      }
      break;
    }
    case "n": {
      if (
        (absRowDiff === 2 && absColDiff === 1) ||
        (absRowDiff === 1 && absColDiff === 2)
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
      if (
        (startRow === endRow || startCol === endCol) &&
        pathIsClear(board, startRow, startCol, endRow, endCol)
      ) {
        return true;
      }
      // Moving diagonally
      if (diagIsClear(board, startRow, startCol, endRow, endCol)) {
        return true;
      }
      break;
    }
    case "k": {
      if (absRowDiff <= 1 && absColDiff <= 1) {
        return true;
      }
      // Castling
      if (absColDiff === 2 && absRowDiff === 0) {
        if (gameState.kingMoved[player]) return false;

        const kingSide = endCol > startCol ? "kingside" : "queenside";
        return isCastlingLegal(board, player, gameState, kingSide);
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
    if (startCol < endCol) {
      for (let col = startCol + 1; col < endCol; col++) {
        if (board[startRow][col] !== "-") return false;
      }
    } else {
      for (let col = startCol - 1; col > endCol; col--) {
        if (board[startRow][col] !== "-") return false;
      }
    }
  }

  // Moving vertically
  if (startCol === endCol) {
    if (startRow < endRow) {
      for (let row = startRow + 1; row < endRow; row++) {
        if (board[row][startCol] !== "-") return false;
      }
    } else {
      for (let row = startRow - 1; row > endRow; row--) {
        if (board[row][startCol] !== "-") return false;
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
  while (currentRow !== endRow) {
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
  if (!pathIsClear(board, kingRow, kingCol, kingRow, rookCol)) return false;

  // Check if the squares the king passes through, including the destination, are under attack
  const kingDestCol = side === "kingside" ? 6 : 2;
  const midSquareCol = kingCol + (kingDestCol - kingCol) / 2;
  if (
    isSquareUnderAttack(board, kingRow, kingCol, player) ||
    isSquareUnderAttack(board, kingRow, midSquareCol, player) ||
    isSquareUnderAttack(board, kingRow, kingDestCol, player)
  ) {
    return false;
  }

  return true;
}

// Determines whether a square is under attack. Used for checking castling legality
export function isSquareUnderAttack(board, endRow, endCol, player) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (
        piece !== "-" &&
        (player === "w"
          ? piece === piece.toLowerCase() // Find pieces of the opposite player
          : piece === piece.toUpperCase())
      ) {
        // See if opponent can move to the square
        if (canPieceAttackSquare(board, row, col, endRow, endCol)) {
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

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece === "-") continue;

      // Check if piece belongs to the opponent
      const isOpponent =
        player === "w"
          ? piece === piece.toLowerCase()
          : piece === piece.toUpperCase();
      if (!isOpponent) continue;

      // See if opponent can move to take the king
      if (canPieceAttackSquare(board, row, col, kingRow, kingCol)) {
        return true;
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
  if (!isValidMove(board, startRow, startCol, endRow, endCol, gameState)) {
    return false;
  }

  // Simulate move
  const newBoard = simulateMove(board, [
    [startRow, startCol],
    [endRow, endCol],
  ]);

  let tempState = {
    ...gameState,
    kingPosition: { ...gameState.kingPosition },
  };

  if (board[startRow][startCol].toLowerCase() === "k") {
    tempState.kingPosition[player] = [endRow, endCol];
  }

  return !isInCheck(newBoard, player, tempState);
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
  const boardMap = new Map();

  for (let i = 0; i < boards.length; i++) {
    const key = boardToKey(boards[i]);
    const count = boardMap.get(key) || 0;
    if (count + 1 >= 3) {
      return true;
    }
    boardMap.set(key, count + 1);
  }
  return false;
}

// Determines whether there is sufficient material to checkmate
export const insufficientMaterial = (board) => {
  let numWhitePieces = 0;
  let numBlackPieces = 0;

  for (const square of board.flat()) {
    if (square === "-") continue;

    if (square === square.toUpperCase()) {
      numWhitePieces++;
      if (square === "Q" || square === "R" || square === "P") return false;
      // More than king and one extra piece.
      if (numWhitePieces > 2) return false;
    } else {
      numBlackPieces++;
      if (square === "q" || square === "r" || square === "p") return false;
      if (numBlackPieces > 2) return false;
    }
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
  let newGameState = structuredClone(gameState);

  if (piece.toLowerCase() === "p" && Math.abs(toRow - fromRow) === 2) {
    const enPassantRow = player === "w" ? toRow + 1 : toRow - 1;
    // Multiplying row by 8 then adding the col creates a unique identifier number for each square
    newGameState.enPassant = enPassantRow * 8 + toCol;
  } else {
    newGameState.enPassant = null;
  }

  // Updates king position
  if (piece.toLowerCase() === "k") {
    newGameState.kingPosition[player] = [toRow, toCol];
    newGameState.kingMoved[player] = true;

    // If castling (king moves two squares horizontally), update corresponding rook.
    if (Math.abs(toCol - fromCol) === 2) {
      const side = toCol > fromCol ? "kingside" : "queenside";
      newGameState.rookMoved[player][side] = true;
    }
  }
  // Update if rook moved from starting square for black
  if (piece === "r") {
    if (fromRow === 0 && fromCol === 0) {
      newGameState.rookMoved.b.queenside = true;
    } else if (fromRow === 0 && fromCol === 7) {
      newGameState.rookMoved.b.kingside = true;
    }
  }
  // Update if rook moved from starting square for white
  if (piece === "R") {
    if (fromRow === 7 && fromCol === 0) {
      newGameState.rookMoved.w.queenside = true;
    } else if (fromRow === 7 && fromCol === 7) {
      newGameState.rookMoved.w.kingside = true;
    }
  }

  const thingOnPrevSquare = boards[boards.length - 1][toRow][toCol];
  if (piece.toLowerCase() !== "p" && thingOnPrevSquare === "-") {
    newGameState.fiftyMoveCounter = gameState.fiftyMoveCounter + 1;
  } else {
    newGameState.fiftyMoveCounter = 0;
  }
  
  // Check if game is over and updates state if it is
  const deepCopy = board.map((row) => [...row]);
  const gameOverState = isGameOver(board, player, newGameState, [
    ...boards,
    deepCopy,
  ]);
  if (gameOverState !== "none") {
    newGameState.gameOver = true;
    newGameState.gameEndState = gameOverState;
  }

  return newGameState;
};

export const simulateMove = (board, move) => {
  if (move.length === 0) return [];
  
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
    board[toRow][toCol] === "-"
  ) {
    newBoard[fromRow][toCol] = "-";
  }

  return newBoard;
};

export const sortMoves = (board, moves) => {
  const pieceValues = {
    K: 900,
    Q: 90,
    R: 50,
    B: 30,
    N: 30,
    P: 10,
    "-": 0,
  };

  return moves.slice().sort((move1, move2) => {
    const [from1, to1, promo1 = null] = move1;
    const [from2, to2, promo2 = null] = move2;
    
    const captured1 = board[to1[0]][to1[1]].toUpperCase();
    const captured2 = board[to2[0]][to2[1]].toUpperCase();
    
    const piece1 = promo1 ? promo1.toUpperCase() : board[from1[0]][from1[1]].toUpperCase();
    const piece2 = promo2 ? promo2.toUpperCase() : board[from2[0]][from2[1]].toUpperCase();
    
    const value1 = pieceValues[captured1] - pieceValues[piece1];
    const value2 = pieceValues[captured2] - pieceValues[piece2];

    return value2 - value1;
  });
};

// Simplified attack function that can disregard moves like castling, enpassant, etc.
export const canPieceAttackSquare = (board, row, col, targetRow, targetCol) => {
  const piece = board[row][col];
  const pieceType = piece.toLowerCase();
  const rowDiff = targetRow - row;
  const colDiff = targetCol - col;
  const absRowDiff = Math.abs(rowDiff);
  const absColDiff = Math.abs(colDiff);

  switch (pieceType) {
    case "p": {
      // For pawns, only diagonal capture moves count.
      const direction = piece === piece.toUpperCase() ? -1 : 1;
      if (rowDiff === direction && absColDiff === 1) {
        return true;
      }
      break;
    }
    case "n": {
      if (
        (absRowDiff === 2 && absColDiff === 1) ||
        (absRowDiff === 1 && absColDiff === 2)
      ) {
        return true;
      }
      break;
    }
    case "b": {
      if (
        absRowDiff === absColDiff &&
        diagIsClear(board, row, col, targetRow, targetCol)
      ) {
        return true;
      }
      break;
    }
    case "r": {
      if (
        (row === targetRow || col === targetCol) &&
        pathIsClear(board, row, col, targetRow, targetCol)
      ) {
        return true;
      }
      break;
    }
    case "q": {
      if (
        ((row === targetRow || col === targetCol) &&
          pathIsClear(board, row, col, targetRow, targetCol)) ||
        (absRowDiff === absColDiff &&
          diagIsClear(board, row, col, targetRow, targetCol))
      ) {
        return true;
      }
      break;
    }
    case "k": {
      if (absRowDiff <= 1 && absColDiff <= 1) {
        return true;
      }
      break;
    }
  }
  return false;
};

export const doesMovePutInCheck = (board, player, move, gameState) => {
  const newBoard = simulateMove(board, move);
  const newState = { kingPosition: { ...gameState.kingPosition } };

  if (board[move[0][0]][move[0][1]].toLowerCase() === "k") {
    newState.kingPosition[player] = move[1];
  }

  return isInCheck(newBoard, player, newState);
};
