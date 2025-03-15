import { isKingsideCastleLegal, isQueensideCastleLegal } from "./bbChessLogic";
import {
  bigIntFullRep,
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
export const getPieceMoves = (
  bitboards,
  piece,
  from,
  player,
  enPassantSquare,
  castlingRights,
  onlyCaptures = false
) => {
  let moves = null;
  switch (piece) {
    case "P":
      moves = getPawnMovesForSquare(bitboards, player, from, enPassantSquare, onlyCaptures);
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
      moves = getKingMovesForSquare(bitboards, player, from, castlingRights);
      break;
    default:
      moves = BigInt(0); // No legal moves
  }

  return moves;
};

// Gets all moves for a player
export const getAllPlayerMoves = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  onlyCaptures = false
) => {
  let allMoves = 0n;
  // Get player's overall pieces bitboard.
  const playerPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  let pieces = playerPieces;
  while (pieces !== 0n) {
    const square = bitScanForward(pieces);
    pieces &= pieces - 1n;

    const piece = getPieceAtSquare(square, bitboards);
    const formattedPiece = pieceSymbols[piece].toUpperCase();

    const pieceMoves = getPieceMoves(
      bitboards,
      formattedPiece,
      square,
      player,
      enPassantSquare,
      castlingRights,
      onlyCaptures
    );

    allMoves |= pieceMoves;
  }

  return allMoves;
};


/* SPECIFIC PIECE MOVE FUNCTIONS */
export const getPawnMovesForSquare = (
  bitboards,
  player,
  from,
  enPassantSquare,
  attacksOnly = false
) => {
  const specificPawn = 1n << BigInt(from);

  const emptySquares = getEmptySquares(bitboards);
  const enemyPieces =
    player === "w" ? getBlackPieces(bitboards) : getWhitePieces(bitboards);

  let singlePush = 0n;
  let doublePush = 0n;
  let leftCapture = 0n;
  let rightCapture = 0n;
  let enPassantCapture = 0n; // New

  if (player === "w") {
    if (!attacksOnly) {
      singlePush = (specificPawn << 8n) & emptySquares;
      doublePush =
        ((specificPawn & 0x000000000000ff00n) << 16n) &
        emptySquares &
        (emptySquares << 8n);
    }
    leftCapture = (specificPawn << 7n) & enemyPieces & FILE_H_MASK;
    rightCapture = (specificPawn << 9n) & enemyPieces & FILE_A_MASK;

    // En Passant for white
    if (enPassantSquare !== null) {
      if ((specificPawn << 7n) & (1n << BigInt(enPassantSquare))) {
        enPassantCapture |= 1n << BigInt(enPassantSquare);
      }
      if ((specificPawn << 9n) & (1n << BigInt(enPassantSquare))) {
        enPassantCapture |= 1n << BigInt(enPassantSquare);
      }
    }
  } else {
    if (!attacksOnly) {
      singlePush = (specificPawn >> 8n) & emptySquares;
      doublePush =
        ((specificPawn & 0x00ff000000000000n) >> 16n) &
        emptySquares &
        (emptySquares >> 8n);
    }
    leftCapture = (specificPawn >> 9n) & enemyPieces & FILE_H_MASK;
    rightCapture = (specificPawn >> 7n) & enemyPieces & FILE_A_MASK;

    // En Passant for black
    if (enPassantSquare !== null) {
      if ((specificPawn >> 9n) & (1n << BigInt(enPassantSquare))) {
        enPassantCapture |= 1n << BigInt(enPassantSquare);
      }
      if ((specificPawn >> 7n) & (1n << BigInt(enPassantSquare))) {
        enPassantCapture |= 1n << BigInt(enPassantSquare);
      }
    }
  }

  return singlePush | doublePush | leftCapture | rightCapture | enPassantCapture;
};

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

export const getKingMovesForSquare = (
  bitboards,
  player,
  from,
  castlingRights
) => {
  let kingBitboard = 1n << BigInt(from);
  let moves = 0n;

  const friendlyPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  /* BASE MOVES */
  moves |= kingBitboard << 8n; // Up
  moves |= kingBitboard >> 8n; // Down
  moves |= (kingBitboard << 1n) & FILE_A_MASK; // Right
  moves |= (kingBitboard >> 1n) & FILE_H_MASK; // Left
  moves |= (kingBitboard << 9n) & FILE_A_MASK & RANK_8_MASK; // Up-right
  moves |= (kingBitboard << 7n) & FILE_H_MASK & RANK_8_MASK; // Up-left
  moves |= (kingBitboard >> 9n) & FILE_H_MASK & RANK_1_MASK; // Down-left
  moves |= (kingBitboard >> 7n) & FILE_A_MASK & RANK_1_MASK; // Down-right

  /* CASTLING */
  if (castlingRights) {
    if (player === "w") {
      if (castlingRights.whiteKingside && isKingsideCastleLegal(bitboards, "w")) {
        moves |= 1n << 6n;
      }
      if (
        castlingRights.whiteQueenside &&
        isQueensideCastleLegal(bitboards, "w")
      ) {
        moves |= 1n << 2n;
      }
    } else {
      if (castlingRights.blackKingside && isKingsideCastleLegal(bitboards, "b")) {
        moves |= 1n << 62n;
      }
      if (
        castlingRights.blackQueenside &&
        isQueensideCastleLegal(bitboards, "b")
      ) {
        moves |= 1n << 58n;
      }
    }
  }

  // Remove squares occupied by own pieces
  return moves & ~friendlyPieces;
};
