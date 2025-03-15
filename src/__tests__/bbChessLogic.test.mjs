import { isValidMove, makeMove } from "../components/bitboardUtils/bbChessLogic";
import { initialBitboards } from "../components/bitboardUtils/bbHelpers";

describe("makeMove", () => {
  test("moves a piece to an empty square", () => {
    const bitboards = {
      P: 0b10000000n, // White pawn at square 7 (H2)
      p: 0b1000000000000000n, // Black pawn at square 15 (H7)
    };
    const from = 7;
    const to = 0;

    const newBitboards = makeMove(bitboards, from, to);

    expect(newBitboards.P).toBe(1n); // Pawn should be at 0 now
    expect(newBitboards.p).toBe(0b1000000000000000n); // Black pawn unchanged
  });

  test("captures an opponent's piece", () => {
    const bitboards = {
      P: 0b10000000n, // White pawn at square 7 (H2)
      p: 0b1000000000000000n, // Black pawn at square 15 (H7)
    };
    const from = 7;
    const to = 15;

    const newBitboards = makeMove(bitboards, from, to);

    expect(newBitboards.P).toBe(0b1000000000000000n); // White pawn moves
    expect(newBitboards.p).toBe(0n); // Black pawn is captured
  });

  test("does nothing if there is no piece to move", () => {
    const bitboards = {
      P: 0b10000000n, // White pawn at square 7 (H2)
    };
    const from = 15;
    const to = 23;

    const newBitboards = makeMove(bitboards, from, to);
    expect(newBitboards).toEqual(bitboards); // Nothing should change
  });
});

describe("isValidMove", () => {
  test("returns true for a valid move", () => {
    const bitboards = initialBitboards
    const player = "w";
    expect(isValidMove(bitboards, 8, 16, player)).toBe(true); // White pawn can capture black pawn
    expect(isValidMove(bitboards, 1, 18, player)).toBe(true); // White pawn can capture black pawn
  });

  test("returns false for an invalid move", () => {
    const bitboards = initialBitboards
    const player = "w";
    expect(isValidMove(bitboards, 8, 17, player)).toBe(false); // Pawns can't jump
    expect(isValidMove(bitboards, 27, 35, player)).toBe(false); // Pawns can't jump
  });

  test("returns false if trying to capture own piece", () => {
    const bitboards = initialBitboards
    const player = "w";
    expect(isValidMove(bitboards, 0, 1, player)).toBe(false); // Can't capture own piece
  });
});