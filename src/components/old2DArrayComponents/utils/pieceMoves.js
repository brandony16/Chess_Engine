import { doesMovePutInCheck, isCastlingLegal } from "./chessLogic";

/*
 Get all moves for a specific piece not considering checks
*/
const getPawnMoves = (board, row, col, player, gameState) => {
  const direction = player === "w" ? -1 : 1;
  const opponentPiece = (piece) => {
    piece !== "-" &&
      (player === "w" ? 
        piece === piece.toLowerCase() :
        piece === piece.toUpperCase());
  };

  const moves = [];

  // Move 1 square
  if (board[row + direction][col] === "-") {
    if (row + direction === 7) {
      ["q", "r", "b", "n"].forEach((promo) => {
        moves.push([[row, col], [row + direction, col], promo]);
      });
    } else if (row + direction === 0) {
      ["Q", "R", "B", "N"].forEach((promo) => {
        moves.push([[row, col], [row + direction, col], promo]);
      });
    } else {
      moves.push([
        [row, col],
        [row + direction, col],
      ]);
    }
  }

  // Move 2 squares
  if ((player === "w" && row === 6) || (player == "b" && row === 1)) {
    // Check if pawn is on starting rank and if both squares in front of pawn are clear
    if (
      board[row + direction][col] === "-" &&
      board[row + direction * 2][col] === "-"
    ) {
      moves.push([
        [row, col],
        [row + direction * 2, col],
      ]);
    }
  }

  // Capture
  const xChange = [-1, 1];
  xChange.forEach((dx) => {
    const newCol = col + dx;
    if (
      newCol >= 0 &&
      newCol <= 7 &&
      opponentPiece(board[row + direction][newCol])
    ) {
      moves.push([row, col], [row + direction, newCol]);
    }
  });

  // En Passant
  if (gameState.enPassant !== null) {
    const enPassantRow = Math.floor(gameState.enPassant / 8);
    const enPassantCol = gameState.enPassant % 8;

    if (Math.abs(col - enPassantCol) === 1 && row + direction === enPassantRow) {
      moves.push([[row, col], [enPassantRow, enPassantCol]]);
    }
  }

  return moves;
};

const getRookMoves = (board, row, col, player) => {
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

    const opponentPieces = player === "w" ? "pnbrqk" : "PNBRQK";

    while (currRow >= 0 && currRow < 8 && currCol >= 0 && currCol < 8) {
      const target = board[currRow][currCol];

      // Check if square is empty or has enemy piece
      if (target === "-" || opponentPieces.includes(target)) {
        moves.push([
          [row, col],
          [currRow, currCol],
        ]);
      }

      // If the target square is not empty, the loop stops because rooks cannot go through pieces.
      if (target !== "-") {
        break;
      }

      currRow += dir[0];
      currCol += dir[1];
    }
  }
  return moves;
};

const getKnightMoves = (board, row, col, player) => {
  // Knight can move 2 in one direction and 1 in the other in any way
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

  // Determine opponent pieces based on player
  const opponentPieces = player === "w" ? "pnbrqk" : "PNBRQK";

  for (const move of baseMoves) {
    const newRow = row + move[0];
    const newCol = col + move[1];

    // Check if within bounds
    if (0 <= newRow && newRow < 8 && 0 <= newCol && newCol < 8) {
      const targetCell = board[newRow][newCol];

      // Check if square is empty or is an enemy piece
      if (targetCell === "-" || opponentPieces.includes(targetCell)) {
        moves.push([
          [row, col],
          [newRow, newCol],
        ]);
      }
    }
  }

  return moves;
};

const getBishopMoves = (board, row, col, player) => {
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

    const opponentPieces = player === "w" ? "pnbrqk" : "PNBRQK";

    while (currRow >= 0 && currRow < 8 && currCol >= 0 && currCol < 8) {
      const target = board[currRow][currCol];

      // Check if square is empty or is an enemy piece
      if (target === "-" || opponentPieces.includes(target)) {
        moves.push([
          [row, col],
          [currRow, currCol],
        ]);
      }

      // If the target is not empty, the loop stops as bishops cannot hop over other pieces
      if (target !== "-") {
        break;
      }

      currRow += dir[0];
      currCol += dir[1];
    }
  }

  return moves;
};

const getQueenMoves = (board, row, col, player) => {
  // Rook + Bishop directions combined
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

    const opponentPieces = player === "w" ? "pnbrqk" : "PNBRQK";

    while (currRow >= 0 && currRow < 8 && currCol >= 0 && currCol < 8) {
      const target = board[currRow][currCol];

      // Check if square is empty or is an enemy piece
      if (target === "-" || opponentPieces.includes(target)) {
        moves.push([
          [row, col],
          [currRow, currCol],
        ]);
      }

      // If the target is not empty, the loop stops as queens cannot hop over other pieces
      if (target !== "-") {
        break;
      }

      currRow += dir[0];
      currCol += dir[1];
    }
  }

  return moves;
};

export const getKingMoves = (board, row, col, player, gameState) => {
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
    const currRow = row + move[0];
    const currCol = col + move[1];

    const opponentPieces = player === "w" ? "pnbrqk" : "PNBRQK";

    // Check if king is on board after the move
    if (currRow >= 0 && currRow < 8 && currCol >= 0 && currCol < 8) {
      const target = board[currRow][currCol];

      // Check if square is empty
      if (target === "-" || opponentPieces.includes(target)) {
        moves.push([
          [row, col],
          [currRow, currCol],
        ]);
      }
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

// Get all moves of types pieces. Dont need king because you can only have one.
export const getAllPawnMoves = (board, player, gameState) => {
  let moves = [];
  const piece = player === "w" ? "P" : "p";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === piece) {
        moves.push(...getPawnMoves(board, r, c, player, gameState));
      }
    }
  }

  return moves;
};

export const getAllRookMoves = (board, player) => {
  let moves = [];
  const piece = player === "w" ? "R" : "r";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === piece) {
        moves.push(...getRookMoves(board, r, c, player));
      }
    }
  }

  return moves;
};

export const getAllKnightMoves = (board, player) => {
  let moves = [];
  const piece = player === "w" ? "N" : "n";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === piece) {
        moves.push(...getKnightMoves(board, r, c, player));
      }
    }
  }

  return moves;
};

export const getAllBishopMoves = (board, player) => {
  let moves = [];
  const piece = player === "w" ? "B" : "b";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === piece) {
        moves.push(...getBishopMoves(board, r, c, player));
      }
    }
  }

  return moves;
};

export const getAllQueenMoves = (board, player) => {
  let moves = [];
  const piece = player === "w" ? "Q" : "q";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === piece) {
        moves.push(...getQueenMoves(board, r, c, player));
      }
    }
  }

  return moves;
};

// Gets all legal moves in the position. Filters out those that put the king in check, etc.
export const getLegalMoves = (board, player, gameState) => {
  const [kingRow, kingCol] = gameState.kingPosition[player];
  const pawnMoves = getAllPawnMoves(board, player, gameState);
  const rookMoves = getAllRookMoves(board, player);
  const knightMoves = getAllKnightMoves(board, player);
  const bishopMoves = getAllBishopMoves(board, player);
  const queenMoves = getAllQueenMoves(board, player);
  const kingMoves = getKingMoves(board, kingRow, kingCol, player, gameState);
  const allMoves = [
    ...pawnMoves,
    ...rookMoves,
    ...knightMoves,
    ...bishopMoves,
    ...queenMoves,
    ...kingMoves,
  ];

  // Filter moves that put the king in check.
  const validMoves = allMoves.filter((move) =>
    !doesMovePutInCheck(board, player, move, gameState)
  );
  
  return validMoves;
};
