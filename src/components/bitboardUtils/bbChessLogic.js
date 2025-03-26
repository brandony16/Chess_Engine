import {
  bigIntFullRep,
  bitScanForward,
  getBlackPieces,
  getNumPieces,
  getPieceAtSquare,
  getWhitePieces,
  isPlayersPieceAtSquare,
  pieceSymbols,
} from "./bbHelpers";
import {
  getAllLegalMoves,
  getAllPlayerMoves,
  getPieceMoves,
} from "./bbMoveGeneration";

// Makes a move given a from and to square (ints 0-63). Move validation is handled by other functions
export const makeMove = (
  bitboards,
  from,
  to,
  enPassantSquare = null,
  promotionPiece = null
) => {
  let updatedBitboards = { ...bitboards };

  // Handle castle case
  if (
    pieceSymbols[getPieceAtSquare(from, bitboards)].toLowerCase() === "k" &&
    Math.abs(to - from) === 2
  ) {
    return makeCastleMove(bitboards, from, to);
  }

  // Find which piece is at 'from' square
  let movingPiece = null;
  for (const [piece, bitboard] of Object.entries(bitboards)) {
    if ((bitboard >> BigInt(from)) & BigInt(1)) {
      movingPiece = piece;
      updatedBitboards[piece] &= ~(BigInt(1) << BigInt(from));
      break;
    }
  }

  if (!movingPiece) return { bitboards: updatedBitboards };

  // Check if a piece exists at 'to' (capture)
  let isCapture = false;
  for (const [piece, bitboard] of Object.entries(updatedBitboards)) {
    if ((bitboard >> BigInt(to)) & BigInt(1)) {
      updatedBitboards[piece] &= ~(BigInt(1) << BigInt(to)); // Remove captured piece
      isCapture = true;
      break;
    }
  }

  // Handles promotions
  if (promotionPiece) {
    const promotedPieceKey =
      movingPiece === "whitePawns"
        ? `white${promotionPiece}`
        : `black${promotionPiece}`;

    updatedBitboards[promotedPieceKey] |= 1n << BigInt(to); // Add promoted piece
    return {
      bitboards: updatedBitboards,
      enPassantSquare: null,
      isCapture: isCapture,
    };
  }

  // Move piece to 'to' square
  updatedBitboards[movingPiece] |= BigInt(1) << BigInt(to);

  // Handle En Passant
  let newEnPassantSquare = null;
  const player = movingPiece === "whitePawns" ? "w" : "b";
  if (movingPiece === "whitePawns" || movingPiece === "blackPawns") {
    if (Math.abs(to - from) === 16) {
      newEnPassantSquare = player === "w" ? to - 8 : to + 8;
    }

    if (to === enPassantSquare) {
      const capturedPawnSquare = player === "w" ? to - 8 : to + 8;
      updatedBitboards[player === "w" ? "blackPawns" : "whitePawns"] &= ~(
        BigInt(1) << BigInt(capturedPawnSquare)
      );
    }
  }

  return {
    bitboards: updatedBitboards,
    enPassantSquare: newEnPassantSquare,
    isCapture: isCapture,
  };
};

// Determines whether a give move is valid.
export const isValidMove = (
  bitboards,
  from,
  to,
  player,
  enPassantSquare = null,
  castlingRights
) => {
  // If start square is not one of the player's pieces, then it is not a valid move
  if (!isPlayersPieceAtSquare(player, from, bitboards)) {
    return false;
  }
  // If the final square is one of the player's pieces, then it is not valid
  // Cannot capture your own piece
  if (isPlayersPieceAtSquare(player, to, bitboards)) {
    return false;
  }

  // Get the piece type then convert it to 'P', 'N', 'B', 'R', 'Q', or 'K'
  const piece = getPieceAtSquare(from, bitboards);
  const formattedPiece = pieceSymbols[piece].toUpperCase();

  const pieceMoves = getPieceMoves(
    bitboards,
    formattedPiece,
    from,
    player,
    enPassantSquare,
    castlingRights
  );
  const legalMoves = filterIllegalMoves(bitboards, pieceMoves, from, player);

  return Boolean((legalMoves >> BigInt(to)) & BigInt(1));
};

// Determines whether a specific square is attacked by the opponent
export const isSquareAttacked = (bitboards, square, opponent) => {
  const opponentMoves = getAllPlayerMoves(
    bitboards,
    opponent,
    null,
    null,
    true
  );

  return Boolean((opponentMoves >> BigInt(square)) & 1n);
};

export const isInCheck = (bitboards, player) => {
  let kingBB = bitboards.whiteKings;
  if (player === "b") {
    kingBB = bitboards.blackKings;
  }

  const kingSquare = bitScanForward(kingBB);

  return isSquareAttacked(bitboards, kingSquare, player === "w" ? "b" : "w");
};

// Filters out moves that put the king in check
export const filterIllegalMoves = (bitboards, moves, from, player) => {
  let filteredMoves = 0n;

  // Iterate only over moves that are set (i.e. bits that are 1)
  let remainingMoves = moves;
  while (remainingMoves !== 0n) {
    const to = bitScanForward(remainingMoves);
    remainingMoves &= remainingMoves - 1n;

    // Simulate the move and check if the king is attacked
    const tempBitboards = makeMove(bitboards, from, to, null).bitboards;
    const kingBB = tempBitboards[player === "w" ? "whiteKings" : "blackKings"];
    const kingSquare = bitScanForward(kingBB);
    if (
      !isSquareAttacked(tempBitboards, kingSquare, player === "w" ? "b" : "w")
    ) {
      filteredMoves |= 1n << BigInt(to);
    }
  }

  return filteredMoves;
};

// Updates the castling rights when a rook or king moves
export const updateCastlingRights = (from, prevRights) => {
  const newRights = { ...prevRights };

  // If a king moves, it loses castling rights
  if (from === 4) {
    newRights.whiteKingside = false;
    newRights.whiteQueenside = false;
  } else if (from === 60) {
    newRights.blackKingside = false;
    newRights.blackQueenside = false;
  }

  // If rooks move, disable their respective castling
  if (from === 0) newRights.whiteQueenside = false;
  if (from === 7) newRights.whiteKingside = false;
  if (from === 56) newRights.blackQueenside = false;
  if (from === 63) newRights.blackKingside = false;

  return newRights;
};

/* CASTLING FUNCTIONS */
export const isKingsideCastleLegal = (bitboards, player) => {
  let squares;
  let opponent;
  if (player === "w") {
    squares = [4, 5, 6];
    opponent = "b";
  } else {
    squares = [60, 61, 62];
    opponent = "w";
  }

  // Check if squares are empty or under attack
  for (let square of squares) {
    const piece = getPieceAtSquare(square, bitboards);
    if (piece !== null && pieceSymbols[piece].toLowerCase() !== "k") {
      return false;
    }
    if (isSquareAttacked(bitboards, square, opponent)) {
      return false;
    }
  }

  return true;
};

export const isQueensideCastleLegal = (bitboards, player) => {
  let squares;
  let opponent;
  if (player === "w") {
    squares = [1, 2, 3, 4];
    opponent = "b";
  } else {
    squares = [57, 58, 59, 60];
    opponent = "w";
  }

  // Check if squares are empty or under attack
  for (let square of squares) {
    const piece = getPieceAtSquare(square, bitboards);
    if (piece !== null && pieceSymbols[piece].toLowerCase() !== "k") {
      return false;
    }
    if (isSquareAttacked(bitboards, square, opponent)) {
      return false;
    }
  }

  return true;
};

// Helper function that handles and makes castle moves
export const makeCastleMove = (bitboards, from, to) => {
  let newBitboards = { ...bitboards };

  if (from === 4 && to === 6) {
    // White kingside castling
    newBitboards["whiteKings"] &= ~(1n << 4n);
    newBitboards["whiteKings"] |= 1n << 6n;
    newBitboards["whiteRooks"] &= ~(1n << 7n);
    newBitboards["whiteRooks"] |= 1n << 5n;
  } else if (from === 4 && to === 2) {
    // White queenside castling
    newBitboards["whiteKings"] &= ~(1n << 4n);
    newBitboards["whiteKings"] |= 1n << 2n;
    newBitboards["whiteRooks"] &= ~(1n << 0n);
    newBitboards["whiteRooks"] |= 1n << 3n;
  } else if (from === 60 && to === 62) {
    // Black kingside castling
    newBitboards["blackKings"] &= ~(1n << 60n);
    newBitboards["blackKings"] |= 1n << 62n;
    newBitboards["blackRooks"] &= ~(1n << 63n);
    newBitboards["blackRooks"] |= 1n << 61n;
  } else if (from === 60 && to === 58) {
    // Black queenside castling
    newBitboards["blackKings"] &= ~(1n << 60n);
    newBitboards["blackKings"] |= 1n << 58n;
    newBitboards["blackRooks"] &= ~(1n << 56n);
    newBitboards["blackRooks"] |= 1n << 59n;
  }
  return { bitboards: newBitboards, enPassantSquare: null, isCapture: false };
};

export const checkGameOver = (
  bitboards,
  player,
  pastPositions,
  castlingRights,
  enPassantSquare
) => {
  const opponent = player === "w" ? "b" : "w";

  const allLegalMoves = getAllLegalMoves(
    bitboards,
    opponent,
    castlingRights,
    enPassantSquare
  );

  const kingBB = bitboards[player === "w" ? "blackKings" : "whiteKings"];
  const kingSquare = bitScanForward(kingBB);

  const result = { isGameOver: false, result: null };

  if (drawByInsufficientMaterial(bitboards)) {
    result.isGameOver = true;
    result.result = "Draw by Insufficient Material";
    return result;
  }
  if (drawByFiftyMoveRule(bitboards, pastPositions)) {
    result.isGameOver = true;
    result.result = "Draw By 50 Move Rule";
    return result;
  }
  if (drawByRepetition(pastPositions)) {
    result.isGameOver = true;
    result.result = "Draw by Repetition";
    return result;
  }

  // If player has no moves it is stalemate or checkmate
  if (allLegalMoves === 0n) {
    result.isGameOver = true;

    if (isSquareAttacked(bitboards, kingSquare, player)) {
      // Inversed because we are checking if 'player' has moves. If they dont and are in check, the other player wins
      const fullPlayer = player === "w" ? "White" : "Black";

      result.result = `${fullPlayer} Wins by Checkmate`;
      return result;
    } else {
      result.result = "Draw by Stalemate";
      return result;
    }
  }

  return result;
};

// Determines whether there is sufficient checkmating material
export const drawByInsufficientMaterial = (bitboards) => {
  const whitePieces = getWhitePieces(bitboards);
  const blackPieces = getBlackPieces(bitboards);

  const queens = bitboards.whiteQueens | bitboards.blackQueens;
  const rooks = bitboards.whiteRooks | bitboards.blackRooks;
  const pawns = bitboards.whitePawns | bitboards.blackPawns;
  const queensRooksPawns = queens | rooks | pawns;

  if (queensRooksPawns !== 0n) {
    return false;
  } else if (getNumPieces(whitePieces) <= 2 && getNumPieces(blackPieces) <= 2) {
    return true;
  }

  return false;
};

export const drawByRepetition = (pastPositions) => {
  for (let count of pastPositions.values()) {
    if (count >= 3) {
      return true;
    }
  }
  return false;
};

export const drawByFiftyMoveRule = (pastPositions) => {
  return false;
};

export const sortMoves = (moves) => {
  return moves.sort((a, b) => b.isCapture - a.isCapture);
}
