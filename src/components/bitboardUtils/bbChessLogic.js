import { bitScanForward, getPieceAtSquare, isPlayersPieceAtSquare, pieceSymbols } from "./bbHelpers";
import { getAllLegalMoves, getPieceMoves } from "./bbMoveGeneration";

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

  const pieceMoves = getPieceMoves(bitboards, formattedPiece, from, player);
  const legalMoves = filterIllegalMoves(bitboards, pieceMoves, from, player);

  return Boolean((legalMoves >> BigInt(to)) & BigInt(1));
}

// Determines whether a specific square is attacked by the opponent
export const isSquareAttacked = (bitboards, square, opponent) => {
  const opponentMoves = getAllLegalMoves(bitboards, opponent);

  return Boolean((opponentMoves >> BigInt(square)) & 1n);
}

export const filterIllegalMoves = (bitboards, moves, from, player) => {
  let filteredMoves = 0n;
  
  const kingBB = bitboards[player === "w" ? "whiteKings" : "blackKings"];
  const kingSquare = bitScanForward(kingBB);
  
  // Iterate only over moves that are set (i.e. bits that are 1)
  let remainingMoves = moves;
  while (remainingMoves !== 0n) {
    const to = bitScanForward(remainingMoves);
    remainingMoves &= remainingMoves - 1n;
    
    // Simulate the move and check if the king is attacked
    const tempBitboards = makeMove(bitboards, from, to);
    if (!isSquareAttacked(tempBitboards, kingSquare
      , player === "w" ? "b" : "w")) {
      filteredMoves |= (1n << BigInt(to));
    }
  }
  // NEED TO FIX PAWNS. THEY CANNOT CAPTURE MOVING FORWARD BUT CAN MOVE FORWARD. THESE MOVES SHOULD NOT BE FILTERED

  
  return filteredMoves;
}

