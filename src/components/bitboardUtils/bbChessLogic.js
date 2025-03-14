import { getBlackPieceLocations, getPlayerBoard, getWhitePieceLocations, isPlayersPieceAtSquare } from "./bbHelpers";

// Makes a move given a from and to square (ints 0-63)
export const makeMove = (bitboards, from, to) => {
  let updatedBitboards = { ...bitboards };  

  // Find which piece is at 'from' square
  let movingPiece = null;
  for (const [piece, bitboard] of Object.entries(bitboards)) {
    if ((bitboard >> BigInt(from)) & BigInt(1)) {
      movingPiece = piece;
      updatedBitboards[piece] &= ~(BigInt(1) << BigInt(from)); 
      break;
    }
  }

  if (!movingPiece) return updatedBitboards; // No piece found at 'from', return unchanged

  // Check if a piece exists at 'to' (capture scenario)
  for (const [piece, bitboard] of Object.entries(updatedBitboards)) {
    if ((bitboard >> BigInt(to)) & BigInt(1)) {
      updatedBitboards[piece] &= ~(BigInt(1) << BigInt(to)); // Remove captured piece
      break;
    }
  }

  // Move piece to 'to' square
  updatedBitboards[movingPiece] |= BigInt(1) << BigInt(to);

  return updatedBitboards
};

export const isValidMove = (bitboards, from, to, player) => {
  return isPlayersPieceAtSquare(player, from, bitboards);
}