import {
  isSquareAttacked,
  isValidMove,
  makeMove,
} from "../components/bitboardUtils/bbChessLogic";
import { initialBitboards } from "../components/bitboardUtils/bbHelpers";

describe("makeMove", () => {
  test("moves a piece to an empty square", () => {
    const bitboards = {
      whitePawns: 0b10000000n,
      blackPawns: 0b1000000000000000n,
    };
    const from = 7;
    const to = 0;

    const newBitboards = makeMove(bitboards, from, to).bitboards;

    expect(newBitboards.whitePawns).toBe(1n);
    expect(newBitboards.blackPawns).toBe(0b1000000000000000n); // Black pawn unchanged
  });

  test("captures an opponent's piece", () => {
    const bitboards = {
      whitePawns: 0b10000000n,
      blackPawns: 0b1000000000000000n,
    };
    const from = 7;
    const to = 15;

    const newBitboards = makeMove(bitboards, from, to).bitboards;

    expect(newBitboards.whitePawns).toBe(0b1000000000000000n); // White pawn moves
    expect(newBitboards.blackPawns).toBe(0n); // Black pawn is captured
  });

  test("does nothing if there is no piece to move", () => {
    const bitboards = {
      whitePawns: 0b10000000n, // White pawn at square 7 (H2)
    };
    const from = 15;
    const to = 23;

    const newBitboards = makeMove(bitboards, from, to).bitboards;
    expect(newBitboards).toEqual(bitboards); // Nothing should change
  });
});

describe("isValidMove", () => {
  let bitboards;
  let castlingRights;

  beforeEach(() => {
    bitboards = initialBitboards;
    castlingRights = {
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    }
  });
  test("returns true for a valid move", () => {
    const player = "w";
    expect(isValidMove(bitboards, 8, 16, player, null, castlingRights)).toBe(true); // Pawn move from a2 to a3
    expect(isValidMove(bitboards, 1, 18, player, null, castlingRights)).toBe(true); // Knight move from b1 to c3
  });

  test("returns false for an invalid move", () => {
    const player = "w";
    expect(isValidMove(bitboards, 8, 17, player, null, castlingRights)).toBe(false); // Pawns can't move diagonally
    expect(isValidMove(bitboards, 27, 35, player, null, castlingRights)).toBe(false); // No piece at square
  });

  test("returns false if trying to capture own piece", () => {
    const player = "w";
    expect(isValidMove(bitboards, 0, 1, player, null, castlingRights)).toBe(false); // Can't capture own piece
  });
});

describe("isSquareAttacked", () => {
  let bitboards;

  beforeEach(() => {
    bitboards = initialBitboards;
  });

  test("returns true if square is attacked", () => {
    expect(isSquareAttacked(bitboards, 21, "w")).toBe(true);
    expect(isSquareAttacked(bitboards, 40, "b")).toBe(true);
  });

  test("returns false if a square is not attacked", () => {
    // Pawn can move two squares but cant capture 2 squares ahead
    expect(isSquareAttacked(bitboards, 26, "w")).toBe(false);
    expect(isSquareAttacked(bitboards, 34, "w")).toBe(false);
  });
});
