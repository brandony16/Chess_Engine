import { getPieceAtSquare, isPlayersPieceAtSquare, pieceSymbols } from "./bbHelpers";
import { getLegalMoves } from "./bbMoveGeneration";

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
  // If start square is not one of the player's pieces, then it is not a valid move
  if (!isPlayersPieceAtSquare(player, from, bitboards)) {
    return false;
  };
  // If the final square is one of the player's pieces, then it is not valid
  // Cannot capture your own piece
  if (isPlayersPieceAtSquare(player, to, bitboards)) {
    return false;
  }

  // Get the piece type then convert it to 'P', 'N', 'B', 'R', 'Q', or 'K'
  const piece = getPieceAtSquare(from, bitboards);
  const formattedPiece = pieceSymbols[piece].toUpperCase();

  const legalMoves = getLegalMoves(bitboards, formattedPiece, from, player)
  

  return (legalMoves >> BigInt(to)) & BigInt(1);
}

