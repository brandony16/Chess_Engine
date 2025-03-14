import { getBlackPieces, getEmptySquares, getWhitePieces } from "./bbHelpers";

// Gets the legal moves of a piece
export const getLegalMoves = (bitboards, piece, from, player) => {
  switch (piece) {
    case "P":
      return getPawnMovesForSquare(bitboards, player, from);
    case "N":
      return generateKnightMoves(from, bitboards);
    case "B":
      return generateBishopMoves(from, bitboards);
    case "R":
      return generateRookMoves(from, bitboards);
    case "Q":
      return generateQueenMoves(from, bitboards);
    case "K":
      return generateKingMoves(from, player, bitboards);
    default:
      return BigInt(0); // No legal moves
  }
};

const getPawnMovesForSquare = (bitboards, player, from) => {
   const pawnBitboard = player === "w" ? bitboards.whitePawns : bitboards.blackPawns;
   // Isolate the specific pawn using its bit.
   const specificPawn = pawnBitboard & (1n << BigInt(from));
   
   if (!specificPawn) return 0n;
   
   const emptySquares = getEmptySquares(bitboards);
   const enemyPieces = player === "w" ? getBlackPieces(bitboards) : getWhitePieces(bitboards);
 
   // Generates moves for the pawn
   if (player === "w") {
     const singlePush = (specificPawn << 8n) & emptySquares;
     const doublePush = ((specificPawn & 0x000000000000ff00n) << 16n) & emptySquares & (emptySquares << 8n);
     const leftCapture = (specificPawn << 7n) & enemyPieces & 0xfefefefefefefefen;
     const rightCapture = (specificPawn << 9n) & enemyPieces & 0x7f7f7f7f7f7f7f7fn;
     return singlePush | doublePush | leftCapture | rightCapture;
   } else {
     const singlePush = (specificPawn >> 8n) & emptySquares;
     const doublePush = ((specificPawn & 0x00ff000000000000n) >> 16n) & emptySquares & (emptySquares >> 8n);
     const leftCapture = (specificPawn >> 9n) & enemyPieces & 0xfefefefefefefefen;
     const rightCapture = (specificPawn >> 7n) & enemyPieces & 0x7f7f7f7f7f7f7f7fn;
     return singlePush | doublePush | leftCapture | rightCapture;
   }
};

const generateKnightMoves = (from, bitboards) => {};

const generateBishopMoves = (from, bitboards) => {};

const generateRookMoves = (from, bitboards) => {};

const generateQueenMoves = (from, bitboards) => {};

const generateKingMoves = (from, bitboards) => {};
