import {
  initialBitboards,
  getWhitePieces,
  getBlackPieces,
  getAllPieces,
  getPieceAtSquare,
  isPlayersPieceAtSquare,
  slide,
  FILE_A_MASK,
  FILE_H_MASK,
} from "../components/bitboardUtils/bbHelpers";

describe("Bitboard Functions", () => {
  test("getWhitePieces should return all white pieces combined", () => {
    const expected =
      initialBitboards.whitePawns |
      initialBitboards.whiteKnights |
      initialBitboards.whiteBishops |
      initialBitboards.whiteRooks |
      initialBitboards.whiteQueens |
      initialBitboards.whiteKings;

    expect(getWhitePieces(initialBitboards)).toBe(expected);
  });

  test("getBlackPieces should return all black pieces combined", () => {
    const expected =
      initialBitboards.blackPawns |
      initialBitboards.blackKnights |
      initialBitboards.blackBishops |
      initialBitboards.blackRooks |
      initialBitboards.blackQueens |
      initialBitboards.blackKings;

    expect(getBlackPieces(initialBitboards)).toBe(expected);
  });

  test("getAllPieces should return all occupied squares", () => {
    const expected =
      getWhitePieces(initialBitboards) | getBlackPieces(initialBitboards);
    expect(getAllPieces(initialBitboards)).toBe(expected);
  });

  test("getPieceAtSquare should correctly identify a piece at a square", () => {
    expect(getPieceAtSquare(0, initialBitboards)).toBe("whiteRooks"); 
    expect(getPieceAtSquare(60, initialBitboards)).toBe("blackKings"); 
    expect(getPieceAtSquare(63, initialBitboards)).toBe("blackRooks");
    expect(getPieceAtSquare(1, initialBitboards)).toBe("whiteKnights");
    expect(getPieceAtSquare(27, initialBitboards)).toBe(null);
  });

  test("isPlayersPieceAtSquare should return true for player's piece", () => {
    expect(isPlayersPieceAtSquare("w", 0, initialBitboards)).toBe(true); 
    expect(isPlayersPieceAtSquare("b", 56, initialBitboards)).toBe(true);
    expect(isPlayersPieceAtSquare("w", 60, initialBitboards)).toBe(false);
  });

  test("slide should correctly generate attacks and stop at obstacles", () => {
    const allPieces = 0x0000000000000081n
    const whiteRook = 0x0000000000000081n;
    const startingSquare = 1n << 0n;
    const expected = 0x00000000000000ffn - startingSquare; // All in first rank (before hitting piece)

    const result = slide(whiteRook, 1n, FILE_H_MASK, allPieces);
    expect(result).toBe(expected);
  });

  test("slide should stop at first occupied square and include captures", () => {
    const allPieces = getAllPieces(initialBitboards);
    const whiteBishop = 0x0000000000000024n; // C1, F1 bishops

    const result = slide(whiteBishop, 9n, FILE_A_MASK, allPieces); // Diagonal up-right
    expect(result & allPieces).not.toBe(0n); // Ensure it stops at an occupied square
  });
});
