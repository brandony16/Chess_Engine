import { describe, expect, test } from "vitest";
import { computeMaskForPiece } from "../../../../game/attackMasks/attackMasks.ts";
import { Position } from "../../../../game/Position.ts";
import {
  sq,
  WHITE_BISHOP,
  WHITE_KNIGHT,
  WHITE_QUEEN,
  WHITE_ROOK,
  type Square,
} from "../../../../game/chessConstants.ts";
import { squareBB, type Bitboard } from "../../../../game/bb.ts";

function computeExpected(squares: Square[]): Bitboard {
  let totalLo = 0,
    totalHi = 0;
  for (const sq of squares) {
    const [lo, hi] = squareBB(sq);
    totalLo |= lo;
    totalHi |= hi;
  }

  return [totalLo, totalHi];
}

describe("computeMaskForPiece", () => {
  test("unobstructed rook on a1", () => {
    const pos = new Position();
    // white rook on a1 unobstructred
    pos.loadFen("7r/1k6/8/8/8/8/6K1/R7 w - - 0 1");

    // Precomputed mask for a1‐rook on empty board:
    // file A: 0x0101010101010101
    // rank 1: 0x00000000000000FF
    // 0x0101010101010101 + 0xFF = 0x01010101010101FF
    const sqsAttacked = [
      sq.A2,
      sq.A3,
      sq.A4,
      sq.A5,
      sq.A6,
      sq.A7,
      sq.A8,
      sq.B1,
      sq.C1,
      sq.D1,
      sq.E1,
      sq.F1,
      sq.G1,
      sq.H1,
    ];
    const expected = computeExpected(sqsAttacked);

    const mask = computeMaskForPiece(pos, WHITE_ROOK);

    expect(mask).toEqual(expected);
  });

  test("knight on b1", () => {
    const pos = new Position();
    // white knight on b1
    pos.loadFen("6n1/1k6/8/8/8/8/6K1/1N6 w - - 0 1");

    // Knight‐moves from b1: a3, c3, d2
    const expected = computeExpected([sq.A3, sq.C3, sq.D2]);

    const mask = computeMaskForPiece(pos, WHITE_KNIGHT);
    expect(mask).toEqual(expected);
  });

  test("queen on d4 with blockers", () => {
    const pos = new Position();
    // friendly and enemy blockers
    pos.loadFen("8/1k6/5P2/3p4/3Qp3/8/6K1/8 w - - 0 1");

    const sqsAttacked = [
      sq.A1,
      sq.B2,
      sq.C3,
      sq.E5,
      sq.F6,
      sq.A7,
      sq.B6,
      sq.C5,
      sq.E3,
      sq.F2,
      sq.G1,
      sq.A4,
      sq.B4,
      sq.C4,
      sq.E4,
      sq.D1,
      sq.D2,
      sq.D3,
      sq.D5,
    ];
    const expected = computeExpected(sqsAttacked);

    const mask = computeMaskForPiece(pos, WHITE_QUEEN);
    expect(mask).toEqual(expected);
  });

  test("multiple pieces of same type", () => {
    const pos = new Position();
    // 2 white bishops looking at each other on c1 and f4
    pos.loadFen("8/1k6/8/4p3/5B2/8/6K1/2B5 w - - 0 1");

    const sqsAttacked = [
      sq.C1,
      sq.D2,
      sq.E3,
      sq.F4,
      sq.G5,
      sq.H6,
      sq.A3,
      sq.B2,
      sq.E5,
      sq.G3,
      sq.H2,
    ];
    const expected = computeExpected(sqsAttacked);

    const mask = computeMaskForPiece(pos, WHITE_BISHOP);
    expect(mask).toEqual(expected);
  });
});
