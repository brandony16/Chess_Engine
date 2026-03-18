import { describe, it, expect } from "vitest";
import {
  bbAnd,
  bbOr,
  bbXor,
  bbNot,
  bbAndNot,
  bbShiftLeft,
  bbShiftRight,
  setBit,
  clearBit,
  testBit,
  squareBB,
  lsb,
  msb,
  popLsb,
  bbIsEmpty,
  bbNotEmpty,
  moreThanOne,
  popcount,
  bbFromBigInt,
  bbToBigInt,
} from "../../game/bb.ts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Makes tests readable — build a BB from a list of squares
function fromSquares(...squares: number[]): [number, number] {
  let lo = 0,
    hi = 0;
  for (const sq of squares) {
    if (sq < 32) lo |= 1 << sq;
    else hi |= 1 << (sq - 32);
  }
  return [lo, hi];
}

// Collect all set squares from a BB — inverse of fromSquares
function toSquares(lo: number, hi: number): number[] {
  const squares: number[] = [];
  for (let sq = 0; sq < 64; sq++) {
    if (testBit(lo, hi, sq)) squares.push(sq);
  }
  return squares;
}

// ─── setBit / clearBit / testBit ─────────────────────────────────────────────

describe("setBit", () => {
  it("sets a square in lo half", () => {
    const [lo, hi] = setBit(0, 0, 0);
    expect(lo).toBe(1);
    expect(hi).toBe(0);
  });

  it("sets a square in hi half", () => {
    const [lo, hi] = setBit(0, 0, 32);
    expect(lo).toBe(0);
    expect(hi).toBe(1);
  });

  it("sets square 63", () => {
    const [lo, hi] = setBit(0, 0, 63);
    expect(lo).toBe(0);
    expect(hi).toBe(1 << 31);
  });

  it("sets multiple squares", () => {
    let [lo, hi] = setBit(0, 0, 0);
    [lo, hi] = setBit(lo, hi, 31);
    [lo, hi] = setBit(lo, hi, 32);
    [lo, hi] = setBit(lo, hi, 63);
    expect(testBit(lo, hi, 0)).toBe(true);
    expect(testBit(lo, hi, 31)).toBe(true);
    expect(testBit(lo, hi, 32)).toBe(true);
    expect(testBit(lo, hi, 63)).toBe(true);
  });

  it("does not affect other squares", () => {
    const [lo, hi] = setBit(0, 0, 5);
    expect(testBit(lo, hi, 4)).toBe(false);
    expect(testBit(lo, hi, 6)).toBe(false);
  });
});

describe("clearBit", () => {
  it("clears a square in lo half", () => {
    const [lo, hi] = clearBit(0xffffffff, 0xffffffff, 0);
    expect(lo & 1).toBe(0);
  });

  it("clears a square in hi half", () => {
    const [lo, hi] = clearBit(0xffffffff, 0xffffffff, 32);
    expect(hi & 1).toBe(0);
  });

  it("clearing an already-clear square is a no-op", () => {
    const [lo, hi] = clearBit(0, 0, 15);
    expect(lo).toBe(0);
    expect(hi).toBe(0);
  });

  it("set then clear returns empty", () => {
    let [lo, hi] = setBit(0, 0, 17);
    [lo, hi] = clearBit(lo, hi, 17);
    expect(lo).toBe(0);
    expect(hi).toBe(0);
  });
});

describe("testBit", () => {
  it("returns false for empty BB", () => {
    for (let sq = 0; sq < 64; sq++) {
      expect(testBit(0, 0, sq)).toBe(false);
    }
  });

  it("returns true only for set square", () => {
    const [lo, hi] = fromSquares(7, 42);
    expect(testBit(lo, hi, 7)).toBe(true);
    expect(testBit(lo, hi, 42)).toBe(true);
    expect(testBit(lo, hi, 8)).toBe(false);
    expect(testBit(lo, hi, 41)).toBe(false);
  });

  it("boundary: square 31 and 32 are independent", () => {
    const [lo, hi] = fromSquares(31);
    expect(testBit(lo, hi, 31)).toBe(true);
    expect(testBit(lo, hi, 32)).toBe(false);
  });
});

// ─── squareBB ─────────────────────────────────────────────────────────────────

describe("squareBB", () => {
  it("only sets the given square", () => {
    for (const sq of [0, 1, 15, 31, 32, 33, 63]) {
      const [lo, hi] = squareBB(sq);
      expect(toSquares(lo, hi)).toEqual([sq]);
    }
  });
});

// ─── Basic Ops ────────────────────────────────────────────────────────────────

describe("bbAnd", () => {
  it("AND of disjoint sets is empty", () => {
    const [alo, ahi] = fromSquares(0, 1, 2);
    const [blo, bhi] = fromSquares(3, 4, 5);
    const [lo, hi] = bbAnd(alo, ahi, blo, bhi);
    expect(bbIsEmpty(lo, hi)).toBe(true);
  });

  it("AND of identical sets is the same set", () => {
    const [alo, ahi] = fromSquares(5, 10, 40);
    const [lo, hi] = bbAnd(alo, ahi, alo, ahi);
    expect(toSquares(lo, hi)).toEqual([5, 10, 40]);
  });

  it("AND keeps only common squares", () => {
    const [alo, ahi] = fromSquares(1, 2, 3);
    const [blo, bhi] = fromSquares(2, 3, 4);
    const [lo, hi] = bbAnd(alo, ahi, blo, bhi);
    expect(toSquares(lo, hi)).toEqual([2, 3]);
  });
});

describe("bbOr", () => {
  it("OR of disjoint sets contains all squares", () => {
    const [alo, ahi] = fromSquares(0, 32);
    const [blo, bhi] = fromSquares(1, 33);
    const [lo, hi] = bbOr(alo, ahi, blo, bhi);
    expect(toSquares(lo, hi)).toEqual([0, 1, 32, 33]);
  });

  it("OR with empty is identity", () => {
    const [alo, ahi] = fromSquares(5, 10, 40);
    const [lo, hi] = bbOr(alo, ahi, 0, 0);
    expect(toSquares(lo, hi)).toEqual([5, 10, 40]);
  });
});

describe("bbXor", () => {
  it("XOR with itself is empty", () => {
    const [alo, ahi] = fromSquares(1, 2, 3);
    const [lo, hi] = bbXor(alo, ahi, alo, ahi);
    expect(bbIsEmpty(lo, hi)).toBe(true);
  });

  it("XOR toggles bits correctly", () => {
    const [alo, ahi] = fromSquares(1, 2, 3);
    const [blo, bhi] = fromSquares(2, 3, 4);
    const [lo, hi] = bbXor(alo, ahi, blo, bhi);
    expect(toSquares(lo, hi)).toEqual([1, 4]); // 2,3 cancel out
  });
});

describe("bbAndNot", () => {
  it("removes squares in b from a", () => {
    const [alo, ahi] = fromSquares(1, 2, 3, 4);
    const [blo, bhi] = fromSquares(3, 4, 5);
    const [lo, hi] = bbAndNot(alo, ahi, blo, bhi);
    expect(toSquares(lo, hi)).toEqual([1, 2]);
  });

  it("andNot with empty is identity", () => {
    const [alo, ahi] = fromSquares(5, 10, 40);
    const [lo, hi] = bbAndNot(alo, ahi, 0, 0);
    expect(toSquares(lo, hi)).toEqual([5, 10, 40]);
  });
});

// ─── Shifts ───────────────────────────────────────────────────────────────────

describe("bbShiftLeft", () => {
  it("shift by 0 is identity", () => {
    const [alo, ahi] = fromSquares(5, 40);
    const [lo, hi] = bbShiftLeft(alo, ahi, 0);
    expect(toSquares(lo, hi)).toEqual([5, 40]);
  });

  it("shifts squares up by n", () => {
    const [alo, ahi] = fromSquares(0);
    const [lo, hi] = bbShiftLeft(alo, ahi, 8);
    expect(toSquares(lo, hi)).toEqual([8]);
  });

  it("shift crosses lo/hi boundary correctly", () => {
    const [alo, ahi] = fromSquares(28);
    const [lo, hi] = bbShiftLeft(alo, ahi, 8); // 28+8=36, should be in hi
    expect(toSquares(lo, hi)).toEqual([36]);
  });

  it("shift by 32 moves lo entirely into hi", () => {
    const [alo, ahi] = fromSquares(0);
    const [lo, hi] = bbShiftLeft(alo, ahi, 32);
    expect(toSquares(lo, hi)).toEqual([32]);
  });

  it("shift by >= 64 returns empty", () => {
    const [alo, ahi] = fromSquares(0, 63);
    const [lo, hi] = bbShiftLeft(alo, ahi, 64);
    expect(bbIsEmpty(lo, hi)).toBe(true);
  });

  it("bits shifted off the top are discarded", () => {
    const [alo, ahi] = fromSquares(63);
    const [lo, hi] = bbShiftLeft(alo, ahi, 1);
    expect(bbIsEmpty(lo, hi)).toBe(true);
  });
});

describe("bbShiftRight", () => {
  it("shift by 0 is identity", () => {
    const [alo, ahi] = fromSquares(5, 40);
    const [lo, hi] = bbShiftRight(alo, ahi, 0);
    expect(toSquares(lo, hi)).toEqual([5, 40]);
  });

  it("shifts squares down by n", () => {
    const [alo, ahi] = fromSquares(8);
    const [lo, hi] = bbShiftRight(alo, ahi, 8);
    expect(toSquares(lo, hi)).toEqual([0]);
  });

  it("shift crosses hi/lo boundary correctly", () => {
    const [alo, ahi] = fromSquares(36);
    const [lo, hi] = bbShiftRight(alo, ahi, 8); // 36-8=28, should be in lo
    expect(toSquares(lo, hi)).toEqual([28]);
  });

  it("bits shifted off the bottom are discarded", () => {
    const [alo, ahi] = fromSquares(0);
    const [lo, hi] = bbShiftRight(alo, ahi, 1);
    expect(bbIsEmpty(lo, hi)).toBe(true);
  });
});

// ─── LSB / MSB ────────────────────────────────────────────────────────────────

describe("lsb", () => {
  it("returns -1 for empty BB", () => {
    expect(lsb(0, 0)).toBe(-1);
  });

  it("returns 0 for square 0", () => {
    const [lo, hi] = fromSquares(0);
    expect(lsb(lo, hi)).toBe(0);
  });

  it("returns lowest square when multiple set", () => {
    const [lo, hi] = fromSquares(5, 10, 40);
    expect(lsb(lo, hi)).toBe(5);
  });

  it("returns correct square in hi half", () => {
    const [lo, hi] = fromSquares(32, 50);
    expect(lsb(lo, hi)).toBe(32);
  });

  it("boundary: square 31", () => {
    const [lo, hi] = fromSquares(31);
    expect(lsb(lo, hi)).toBe(31);
  });

  it("boundary: square 32", () => {
    const [lo, hi] = fromSquares(32);
    expect(lsb(lo, hi)).toBe(32);
  });
});

describe("msb", () => {
  it("returns -1 for empty BB", () => {
    expect(msb(0, 0)).toBe(-1);
  });

  it("returns 63 for square 63", () => {
    const [lo, hi] = fromSquares(63);
    expect(msb(lo, hi)).toBe(63);
  });

  it("returns highest square when multiple set", () => {
    const [lo, hi] = fromSquares(5, 10, 40);
    expect(msb(lo, hi)).toBe(40);
  });

  it("boundary: square 31 vs 32", () => {
    const [lo, hi] = fromSquares(31, 32);
    expect(msb(lo, hi)).toBe(32);
  });
});

describe("popLsb", () => {
  it("returns the LSB square and clears it", () => {
    const arr = new Int32Array(2);
    const [lo, hi] = fromSquares(3, 10, 40);
    arr[0] = lo;
    arr[1] = hi;

    const sq = popLsb(arr, 0, 1);
    expect(sq).toBe(3);
    expect(testBit(arr[0], arr[1], 3)).toBe(false);
    expect(testBit(arr[0], arr[1], 10)).toBe(true);
    expect(testBit(arr[0], arr[1], 40)).toBe(true);
  });

  it("can iterate all squares via popLsb", () => {
    const squares = [0, 5, 31, 32, 40, 63];
    const arr = new Int32Array(2);
    const [lo, hi] = fromSquares(...squares);
    arr[0] = lo;
    arr[1] = hi;

    const result: number[] = [];
    let sq: number;
    while ((sq = popLsb(arr, 0, 1)) !== -1) result.push(sq);

    expect(result).toEqual(squares);
  });

  it("returns -1 on empty BB", () => {
    const arr = new Int32Array(2);
    expect(popLsb(arr, 0, 1)).toBe(-1);
  });
});

// ─── Queries ──────────────────────────────────────────────────────────────────

describe("bbIsEmpty / bbNotEmpty", () => {
  it("empty BB", () => {
    expect(bbIsEmpty(0, 0)).toBe(true);
    expect(bbNotEmpty(0, 0)).toBe(false);
  });

  it("non-empty BB", () => {
    const [lo, hi] = fromSquares(5);
    expect(bbIsEmpty(lo, hi)).toBe(false);
    expect(bbNotEmpty(lo, hi)).toBe(true);
  });
});

describe("moreThanOne", () => {
  it("false for empty BB", () => {
    expect(moreThanOne(0, 0)).toBe(false);
  });

  it("false for exactly one bit in lo", () => {
    const [lo, hi] = fromSquares(7);
    expect(moreThanOne(lo, hi)).toBe(false);
  });

  it("false for exactly one bit in hi", () => {
    const [lo, hi] = fromSquares(40);
    expect(moreThanOne(lo, hi)).toBe(false);
  });

  it("true for two bits in lo", () => {
    const [lo, hi] = fromSquares(1, 2);
    expect(moreThanOne(lo, hi)).toBe(true);
  });

  it("true for one bit in lo and one in hi", () => {
    const [lo, hi] = fromSquares(5, 40);
    expect(moreThanOne(lo, hi)).toBe(true);
  });

  it("true for two bits in hi", () => {
    const [lo, hi] = fromSquares(33, 40);
    expect(moreThanOne(lo, hi)).toBe(true);
  });
});

// ─── Popcount ─────────────────────────────────────────────────────────────────

describe("popcount", () => {
  it("empty BB is 0", () => {
    expect(popcount(0, 0)).toBe(0);
  });

  it("single square", () => {
    expect(popcount(...fromSquares(0))).toBe(1);
    expect(popcount(...fromSquares(63))).toBe(1);
  });

  it("full board is 64", () => {
    expect(popcount(0xffffffff, 0xffffffff)).toBe(64);
  });

  it("counts across lo/hi boundary", () => {
    const [lo, hi] = fromSquares(31, 32);
    expect(popcount(lo, hi)).toBe(2);
  });

  it("matches known square counts", () => {
    const squares = [0, 5, 10, 31, 32, 40, 63];
    expect(popcount(...fromSquares(...squares))).toBe(squares.length);
  });
});

// ─── Conversion ───────────────────────────────────────────────────────────────

describe("bbFromBigInt / bbToBigInt", () => {
  it("round trips correctly for square 0", () => {
    const b = 1n;
    const [lo, hi] = bbFromBigInt(b);
    expect(bbToBigInt(lo, hi)).toBe(b);
  });

  it("round trips correctly for square 63", () => {
    const b = 1n << 63n;
    const [lo, hi] = bbFromBigInt(b);
    expect(bbToBigInt(lo, hi)).toBe(b);
  });

  it("round trips a complex bitboard", () => {
    const squares = [0, 7, 15, 31, 32, 40, 55, 63];
    let b = 0n;
    for (const sq of squares) b |= 1n << BigInt(sq);
    const [lo, hi] = bbFromBigInt(b);
    expect(bbToBigInt(lo, hi)).toBe(b);
  });

  it("fromBigInt produces correct square layout", () => {
    const b = 1n << 40n;
    const [lo, hi] = bbFromBigInt(b);
    expect(testBit(lo, hi, 40)).toBe(true);
    expect(popcount(lo, hi)).toBe(1);
  });
});
