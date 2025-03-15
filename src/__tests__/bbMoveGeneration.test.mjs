import { bigIntFullRep } from "../components/bitboardUtils/bbHelpers";
import {
  getLegalMoves,
  getPawnMovesForSquare,
  getKnightMovesForSquare,
  getBishopMovesForSquare,
  getRookMovesForSquare,
  getQueenMovesForSquare,
  getKingMovesForSquare,
} from "../components/bitboardUtils/bbMoveGeneration";

describe("Pawn moves", () => {
  test("White pawn on a2 should be able to single & double push", () => {
    const bitboards = {
      whitePawns: 1n << 8n, // a2
      // all other white pieces
      whiteKnights: 0n,
      whiteBishops: 0n,
      whiteRooks: 0n,
      whiteQueens: 0n,
      whiteKings: 0n,
      // all black pieces
      blackPawns: 0n,
      blackKnights: 0n,
      blackBishops: 0n,
      blackRooks: 0n,
      blackQueens: 0n,
      blackKings: 0n,
    };
    // For a pawn on a2 (index 8):
    // - single push goes to a3 (index 16)
    // - double push goes to a4 (index 24)
    const expected = (1n << 16n) | (1n << 24n);
    const moves = getPawnMovesForSquare(bitboards, "w", 8);
    expect(moves).toEqual(expected);
  });

  test("Black pawn on a7 should be able to single & double push", () => {
    const bitboards = {
      blackPawns: 1n << 48n, // a7 (file A, rank 7: 8*6 = 48)
      whitePawns: 0n,
      whiteKnights: 0n,
      whiteBishops: 0n,
      whiteRooks: 0n,
      whiteQueens: 0n,
      whiteKings: 0n,
      blackKnights: 0n,
      blackBishops: 0n,
      blackRooks: 0n,
      blackQueens: 0n,
      blackKings: 0n,
    };
    // For a black pawn on a7:
    // - single push goes to a6 (index 40)
    // - double push goes to a5 (index 32)
    const expected = (1n << 40n) | (1n << 32n);
    const moves = getPawnMovesForSquare(bitboards, "b", 48);
    expect(moves).toEqual(expected);
  });

  test("White pawn capture: pawn on e4 capturing on d5", () => {
    // Place a white pawn on e4 (file e, rank 4; index = 4 + 24 = 28)
    // Place an enemy black piece on d5 (file d, rank 5; index = 3 + 32 = 35)
    const bitboards = {
      whitePawns: 1n << 28n,
      // include a black piece in a capture position:
      blackKnights: 1n << 35n,
      whiteKnights: 0n,
      whiteBishops: 0n,
      whiteRooks: 0n,
      whiteQueens: 0n,
      whiteKings: 0n,
      blackPawns: 0n,
      blackBishops: 0n,
      blackRooks: 0n,
      blackQueens: 0n,
      blackKings: 0n,
    };
    // For a white pawn on e4:
    // - single push goes to e5 (index 36)
    // - capture on the left (from e4, left-forward) goes to d5 (index 35)
    // (Double push should not be generated because the pawn is not on its initial rank.)
    const expected = (1n << 36n) | (1n << 35n);
    const moves = getPawnMovesForSquare(bitboards, "w", 28);
    expect(moves).toEqual(expected);
  });
});

describe("Knight moves", () => {
  test("Knight moves from d4 in an empty board", () => {
    // d4 is index 27.
    const bitboards = {
      whiteKnights: 1n << 27n,
      whitePawns: 0n,
      whiteBishops: 0n,
      whiteRooks: 0n,
      whiteQueens: 0n,
      whiteKings: 0n,
      blackPawns: 0n,
      blackKnights: 0n,
      blackBishops: 0n,
      blackRooks: 0n,
      blackQueens: 0n,
      blackKings: 0n,
    };
    // From d4, expected knight moves (using our 0-indexed mapping):
    // b3: 17, b5: 33, c2: 10, c6: 42, e2: 12, e6: 44, f3: 21, f5: 37.
    const expected =
      (1n << 17n) |
      (1n << 33n) |
      (1n << 10n) |
      (1n << 42n) |
      (1n << 12n) |
      (1n << 44n) |
      (1n << 21n) |
      (1n << 37n);
    const moves = getKnightMovesForSquare(bitboards, "w", 27);
    expect(moves).toEqual(expected);
  });
});

describe("Bishop moves", () => {
  test("Bishop moves from d4 in an empty board", () => {
    // Place a white bishop on d4 (index 27) and no other pieces.
    const bitboards = {
      whiteBishops: 1n << 27n,
      whitePawns: 0n,
      whiteKnights: 0n,
      whiteRooks: 0n,
      whiteQueens: 0n,
      whiteKings: 0n,
      blackPawns: 0n,
      blackKnights: 0n,
      blackBishops: 0n,
      blackRooks: 0n,
      blackQueens: 0n,
      blackKings: 0n,
    };

    // Bishop moves from d4 along diagonals:
    // Up-right: e5 (36), f6 (45), g7 (54), h8 (63)
    // Up-left:  c5 (34), b6 (41), a7 (48)
    // Down-right: e3 (20), f2 (13), g1 (6)
    // Down-left:  c3 (18), b2 (9), a1 (0)
    const expected =
      (1n << 36n) |
      (1n << 45n) |
      (1n << 54n) |
      (1n << 63n) |
      (1n << 34n) |
      (1n << 41n) |
      (1n << 48n) |
      (1n << 20n) |
      (1n << 13n) |
      (1n << 6n) |
      (1n << 18n) |
      (1n << 9n) |
      (1n << 0n);
    const moves = getBishopMovesForSquare(bitboards, "w", 27);
    //console.log("Actual Moves:\n", bigIntFullRep(moves), "Expected Moves:\n", bigIntFullRep(expected))
    expect(moves).toEqual(expected);
  });
});

describe("Rook moves", () => {
  test("Rook moves from d4 in an empty board", () => {
    // Place a white rook on d4 (index 27)
    const bitboards = {
      whiteRooks: 1n << 27n,
      whitePawns: 0n,
      whiteKnights: 0n,
      whiteBishops: 0n,
      whiteQueens: 0n,
      whiteKings: 0n,
      blackPawns: 0n,
      blackKnights: 0n,
      blackBishops: 0n,
      blackRooks: 0n,
      blackQueens: 0n,
      blackKings: 0n,
    };
    // Rook moves from d4 (index 27) are along the rank and file:
    // Horizontal (rank 4): a4 (24), b4 (25), c4 (26), e4 (28), f4 (29), g4 (30), h4 (31)
    // Vertical (file d): d1 (3), d2 (11), d3 (19), d5 (35), d6 (43), d7 (51), d8 (59)
    const expected =
      (1n << 24n) |
      (1n << 25n) |
      (1n << 26n) |
      (1n << 28n) |
      (1n << 29n) |
      (1n << 30n) |
      (1n << 31n) |
      (1n << 3n) |
      (1n << 11n) |
      (1n << 19n) |
      (1n << 35n) |
      (1n << 43n) |
      (1n << 51n) |
      (1n << 59n);
    const moves = getRookMovesForSquare(bitboards, "w", 27);
    expect(moves).toEqual(expected);
  });
});

describe("Queen moves", () => {
  test("Queen moves from d4 in an empty board", () => {
    // Place a white queen on d4 (index 27)
    const bitboards = {
      whiteQueens: 1n << 27n,
      whitePawns: 0n,
      whiteKnights: 0n,
      whiteBishops: 0n,
      whiteRooks: 0n,
      whiteKings: 0n,
      blackPawns: 0n,
      blackKnights: 0n,
      blackBishops: 0n,
      blackRooks: 0n,
      blackQueens: 0n,
      blackKings: 0n,
    };
    // Queen moves are the union of rook and bishop moves from d4.
    const expectedRook =
      (1n << 24n) |
      (1n << 25n) |
      (1n << 26n) |
      (1n << 28n) |
      (1n << 29n) |
      (1n << 30n) |
      (1n << 31n) |
      (1n << 3n) |
      (1n << 11n) |
      (1n << 19n) |
      (1n << 35n) |
      (1n << 43n) |
      (1n << 51n) |
      (1n << 59n);
    const expectedBishop =
      (1n << 36n) |
      (1n << 45n) |
      (1n << 54n) |
      (1n << 63n) |
      (1n << 34n) |
      (1n << 41n) |
      (1n << 48n) |
      (1n << 20n) |
      (1n << 13n) |
      (1n << 6n) |
      (1n << 18n) |
      (1n << 9n) |
      (1n << 0n);
    const expected = expectedRook | expectedBishop;
    const moves = getQueenMovesForSquare(bitboards, "w", 27);
    expect(moves).toEqual(expected);
  });
});

describe("King moves", () => {
  test("King moves from d4 in an empty board", () => {
    // Place a white king on d4 (index 27)
    const bitboards = {
      whiteKings: 1n << 27n,
      whitePawns: 0n,
      whiteKnights: 0n,
      whiteBishops: 0n,
      whiteRooks: 0n,
      whiteQueens: 0n,
      blackPawns: 0n,
      blackKnights: 0n,
      blackBishops: 0n,
      blackRooks: 0n,
      blackQueens: 0n,
      blackKings: 0n,
    };
  });
});
