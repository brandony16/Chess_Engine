// Inital bitboards
export const initialBitboards = {
  whitePawns: BigInt("0x000000000000FF00"),
  whiteKnights: BigInt("0x0000000000000042"),
  whiteBishops: BigInt("0x0000000000000024"),
  whiteRooks: BigInt("0x0000000000000081"),
  whiteQueens: BigInt("0x0000000000000008"),
  whiteKings: BigInt("0x0000000000000010"),
  blackPawns: BigInt("0x00FF000000000000"),
  blackKnights: BigInt("0x4200000000000000"),
  blackBishops: BigInt("0x2400000000000000"),
  blackRooks: BigInt("0x8100000000000000"),
  blackQueens: BigInt("0x0800000000000000"),
  blackKings: BigInt("0x1000000000000000"),
};

// Gets the white bitboards
export const getWhiteBitboards = (bitboards) => {
  return {
    whitePawns: bitboards.whitePawns,
    whiteKnights: bitboards.whiteKnights,
    whiteBishops: bitboards.whiteBishops,
    whiteRooks: bitboards.whiteRooks,
    whiteQueens: bitboards.whiteQueens,
    whiteKings: bitboards.whiteKings,
  }
}

export const getWhitePieces = (bitboards) => {
  return (
    bitboards.whitePawns |
    bitboards.whiteKnights |
    bitboards.whiteBishops |
    bitboards.whiteRooks |
    bitboards.whiteQueens |
    bitboards.whiteKings
  );
}

// Gets the black bitboards
export const getBlackBitboards = (bitboards) => {
  return {
    blackPawns: bitboards.blackPawns,
    blackKnights: bitboards.blackKnights,
    blackBishops: bitboards.blackBishops,
    blackRooks: bitboards.blackRooks,
    blackQueens: bitboards.blackQueens,
    blackKings: bitboards.blackKings,
  }
}

export const getBlackPieces = (bitboards) => {
  return (
    bitboards.blackPawns |
    bitboards.blackKnights |
    bitboards.blackBishops |
    bitboards.blackRooks |
    bitboards.blackQueens |
    bitboards.blackKings
  );
}

export const getPlayerBoard = (player, bitboards) => {
  return player === 'w' ? getWhitePieces(bitboards) : getBlackPieces(bitboards);
}

export const getEmptySquares = (bitboards) => {
  return ~(getWhitePieces(bitboards) | getBlackPieces(bitboards));
}

// Converts the pieces to the correct string for the cell class rendering
export const pieceSymbols = {
  whitePawns: "P", whiteKnights: "N", whiteBishops: "B",
  whiteRooks: "R", whiteQueens: "Q", whiteKings: "K",
  blackPawns: "p", blackKnights: "n", blackBishops: "b",
  blackRooks: "r", blackQueens: "q", blackKings: "k",
};

// Function to get the piece at a given square
export const getPieceAtSquare = (square, bitboards) => {
  for (const [piece, bitboard] of Object.entries(bitboards)) {
    if ((bitboard >> BigInt(square)) & BigInt(1)) {
      return piece;
    }
  }

  return null;
};

export const isPlayersPieceAtSquare = (player, square, bitboards) => {
  const playerBoard = getPlayerBoard(player, bitboards);

  // Move square to first bit and check if it is one
  return Boolean((playerBoard >> BigInt(square)) & BigInt(1));
}