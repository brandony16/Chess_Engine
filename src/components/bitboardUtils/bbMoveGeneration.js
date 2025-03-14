import { filterIllegalMoves } from "./bbChessLogic";
import {
  bitScanForward,
  FILE_A_MASK,
  FILE_H_MASK,
  getAllPieces,
  getBlackPieces,
  getEmptySquares,
  getPieceAtSquare,
  getWhitePieces,
  pieceSymbols,
  RANK_1_MASK,
  RANK_8_MASK,
  slide,
} from "./bbHelpers";

// Gets the legal moves of a piece
export const getPieceMoves = (bitboards, piece, from, player) => {
  let moves = null;
  switch (piece) {
    case "P":
      moves = getPawnMovesForSquare(bitboards, player, from);
      break;
    case "N":
      moves = getKnightMovesForSquare(bitboards, player, from);
      break;
    case "B":
      moves = getBishopMovesForSquare(bitboards, player, from);
      break;
    case "R":
      moves = getRookMovesForSquare(bitboards, player, from);
      break;
    case "Q":
      moves = getQueenMovesForSquare(bitboards, player, from);
      break;
    case "K":
      moves = getKingMovesForSquare(bitboards, player, from);
      break;
    default:
      moves = BigInt(0); // No legal moves
  }

  return moves;
};

export const getAllLegalMoves = (bitboards, player) => {
  let allMoves = 0n;
  // Get player's overall pieces bitboard.
  const playerPieces = player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);
  
  let pieces = playerPieces;
  while (pieces !== 0n) {
    // Store first bit and remove it from the bitboard
    const square = bitScanForward(pieces);
    pieces &= pieces - 1n;
    
    const piece = getPieceAtSquare(square, bitboards);
    const formattedPiece = pieceSymbols[piece].toUpperCase();
    
    const pieceMoves = getPieceMoves(bitboards, formattedPiece, square, player);
    
    allMoves |= pieceMoves;
  }
  
  return allMoves
}

// Generates all pawn moves
const generatePawnMoves = (player, bitboards) => {
  const emptySquares = getEmptySquares(bitboards);

  if (player === "w") {
    let enemyPieces = getBlackPieces(bitboards);
    let pawnBoard = bitboards.whitePawns;

    let singlePush = (pawnBoard << 8n) & emptySquares;

    let doublePush = ((singlePush & 0x0000000000ff0000n) << 8n) & emptySquares;

    // Captures (ensuring it doesn't wrap from H file to A file)
    let leftCapture = (pawnBoard << 7n) & enemyPieces & 0xfefefefefefefefen;
    let rightCapture = (pawnBoard << 9n) & enemyPieces & 0x7f7f7f7f7f7f7f7fn;

    return singlePush | doublePush | leftCapture | rightCapture;
  } else {
    let enemyPieces = getWhitePieces(bitboards);
    let pawnBoard = bitboards.blackPawns;

    let singlePush = (pawnBoard >> 8n) & emptySquares;

    let doublePush = ((singlePush & 0x00ff000000000000n) >> 8n) & emptySquares;

    let leftCapture = (pawnBoard >> 9n) & enemyPieces & 0xfefefefefefefefen;
    let rightCapture = (pawnBoard >> 7n) & enemyPieces & 0x7f7f7f7f7f7f7f7fn;

    return singlePush | doublePush | leftCapture | rightCapture;
  }
};

export const getPawnMovesForSquare = (bitboards, player, from) => {
  const specificPawn = 1n << BigInt(from);

  const emptySquares = getEmptySquares(bitboards);
  const enemyPieces =
    player === "w" ? getBlackPieces(bitboards) : getWhitePieces(bitboards);

  // Generates moves for the pawn
  if (player === "w") {
    const singlePush = (specificPawn << 8n) & emptySquares;
    const doublePush =
      ((specificPawn & 0x000000000000ff00n) << 16n) &
      emptySquares &
      (emptySquares << 8n);
    const leftCapture =
      (specificPawn << 7n) & enemyPieces & 0xfefefefefefefefen;
    const rightCapture =
      (specificPawn << 9n) & enemyPieces & 0x7f7f7f7f7f7f7f7fn;
    return singlePush | doublePush | leftCapture | rightCapture;
  } else {
    const singlePush = (specificPawn >> 8n) & emptySquares;
    const doublePush =
      ((specificPawn & 0x00ff000000000000n) >> 16n) &
      emptySquares &
      (emptySquares >> 8n);
    const leftCapture =
      (specificPawn >> 9n) & enemyPieces & 0xfefefefefefefefen;
    const rightCapture =
      (specificPawn >> 7n) & enemyPieces & 0x7f7f7f7f7f7f7f7fn;
    return singlePush | doublePush | leftCapture | rightCapture;
  }
};

const generateKnightMoves = (from, bitboards) => {};

export const getKnightMovesForSquare = (bitboards, player, from) => {
  let knightBitboard = 1n << BigInt(from);

  // Define masks to prevent wrap-around issues
  const notAFile = 0xfefefefefefefefen; // Blocks moves that wrap from H->A
  const notABFile = 0xfcfcfcfcfcfcfcfcn; // Blocks A and B files
  const notHFile = 0x7f7f7f7f7f7f7f7fn; // Blocks moves that wrap from A->H
  const notHGFile = 0x3f3f3f3f3f3f3f3fn; // Blocks H and G files

  // Generate raw knight moves
  let moves =
    ((knightBitboard << 6n) & notHGFile) | // Left 2, Up 1
    ((knightBitboard << 10n) & notABFile) | // Right 2, Up 1
    ((knightBitboard >> 6n) & notABFile) | // RIght 2, Down 1
    ((knightBitboard >> 10n) & notHGFile) | // Left 2, Down 1
    ((knightBitboard << 15n) & notHFile) | // Up 2, Left 1
    ((knightBitboard << 17n) & notAFile) | // Up 2, Right 1
    ((knightBitboard >> 17n) & notHFile) | // Down 2, Left 1
    ((knightBitboard >> 15n) & notAFile); // Down 2, Right 1

  // Get player's pieces to mask out self-captures
  const friendlyPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  // Remove moves that land on friendly pieces
  return moves & ~friendlyPieces;
};

const generateBishopMoves = (from, bitboards) => {};

export const getBishopMovesForSquare = (bitboards, player, from) => {
  let bishopBitboard = 1n << BigInt(from);
  let moves = 0n;

  // Get occupied squares
  const allPieces = getAllPieces(bitboards);
  const friendlyPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  moves |= slide(bishopBitboard, 9n, FILE_H_MASK & RANK_8_MASK, allPieces); // Up-right
  moves |= slide(bishopBitboard, 7n, FILE_A_MASK & RANK_8_MASK, allPieces); // Up-left
  moves |= slide(bishopBitboard, -7n, FILE_H_MASK & RANK_1_MASK, allPieces); // Down-right
  moves |= slide(bishopBitboard, -9n, FILE_A_MASK & RANK_1_MASK, allPieces); // Down-left

  return moves & ~friendlyPieces;
};

const generateRookMoves = (from, bitboards) => {};

export const getRookMovesForSquare = (bitboards, player, from) => {
  let rookBitboard = 1n << BigInt(from);
  let moves = 0n;

  const allPieces = getAllPieces(bitboards);
  const friendlyPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  moves |= slide(rookBitboard, 1n, FILE_H_MASK, allPieces);
  moves |= slide(rookBitboard, -1n, FILE_A_MASK, allPieces);
  moves |= slide(rookBitboard, 8n, RANK_8_MASK, allPieces);
  moves |= slide(rookBitboard, -8n, RANK_1_MASK, allPieces);

  return moves & ~friendlyPieces;
};

const generateQueenMoves = (from, bitboards) => {};

export const getQueenMovesForSquare = (bitboards, player, from) => {
  let queenBitboard = 1n << BigInt(from);
  let moves = 0n;

  const allPieces = getAllPieces(bitboards);
  const friendlyPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  // Orthogonal Moves
  moves |= slide(queenBitboard, 1n, FILE_H_MASK, allPieces); // Right
  moves |= slide(queenBitboard, -1n, FILE_A_MASK, allPieces); // Left
  moves |= slide(queenBitboard, 8n, RANK_8_MASK, allPieces); // Up
  moves |= slide(queenBitboard, -8n, RANK_1_MASK, allPieces); // Down

  // Diagonal Moves
  moves |= slide(queenBitboard, 9n, FILE_H_MASK & RANK_8_MASK, allPieces); // Up-right
  moves |= slide(queenBitboard, 7n, FILE_A_MASK & RANK_8_MASK, allPieces); // Up-left
  moves |= slide(queenBitboard, -7n, FILE_H_MASK & RANK_1_MASK, allPieces); // Down-right
  moves |= slide(queenBitboard, -9n, FILE_A_MASK & RANK_1_MASK, allPieces); // Down-left

  return moves & ~friendlyPieces;
};

export const getKingMovesForSquare = (bitboards, player, from) => {
  let kingBitboard = 1n << BigInt(from);
  let moves = 0n;

  const friendlyPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  moves |= kingBitboard << 8n; // Up
  moves |= kingBitboard >> 8n; // Down
  moves |= (kingBitboard << 1n) & FILE_A_MASK; // Right
  moves |= (kingBitboard >> 1n) & FILE_H_MASK; // Left
  moves |= (kingBitboard << 9n) & FILE_A_MASK & RANK_8_MASK; // Up-right
  moves |= (kingBitboard << 7n) & FILE_H_MASK & RANK_8_MASK; // Up-left
  moves |= (kingBitboard >> 9n) & FILE_H_MASK & RANK_1_MASK; // Down-left
  moves |= (kingBitboard >> 7n) & FILE_A_MASK & RANK_1_MASK; // Down-right

  // Remove squares occupied by own pieces
  return moves & ~friendlyPieces;
};
