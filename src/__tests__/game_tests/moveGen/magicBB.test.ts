import { describe, expect, test } from "vitest";
import { maskBits } from "../../../game/helpers/bbUtils.ts";
import { rookAttacks, bishopAttacks } from "../../../game/moveGen/sliderMoves.ts";
import { generateBlockerSubsets } from "../../../game/moveGen/magicNumbers/magicGen.ts";
import type { Square } from "../../../game/chessConstants.ts";
import { getFile, getRank } from "../../../game/helpers/boardUtils.ts";

describe("maskBits", () => {
  test("extracts correct bit positions", () => {
    // mask with bits at 0, 2, and 7
    const mask = (1n << 0n) | (1n << 2n) | (1n << 7n);
    const bits = maskBits(mask).sort((a, b) => a - b);
    expect(bits).toEqual([0, 2, 7]);
  });

  test("returns empty array for zero mask", () => {
    expect(maskBits(0n)).toEqual([]);
  });
});

describe("generateBlockerSubsets", () => {
  test("creates 2^N subsets for N mask bits", () => {
    // small mask: bits at 1 and 3 → N=2 → 4 subsets
    const mask = (1n << 1n) | (1n << 3n);

    let numSubs = 0;
    let subs = [];
    for (const sub of generateBlockerSubsets(mask)) {
      subs.push(sub);
      numSubs++;
    }
    expect(numSubs).toBe(4);
    // should include 0, single-bit, and both bits
    const asStrings = subs.map((x) => x.toString());
    expect(asStrings).toEqual(
      expect.arrayContaining([
        "0",
        (1n << 1n).toString(),
        (1n << 3n).toString(),
        ((1n << 1n) | (1n << 3n)).toString(),
      ]),
    );
  });
});

describe("rookAttacks vs brute force", () => {
  test("matches brute-force for empty occupancy on all squares", () => {
    const occ = 0n;
    for (let sq = 0; sq < 64; sq++) {
      const m = rookAttacks(sq, occ);
      expect(m).toBe(rookBruteForce(sq, occ));
    }
  });

  test("matches brute-force for single blocker anywhere", () => {
    for (let blocker = 0; blocker < 64; blocker++) {
      const occ = 1n << BigInt(blocker);
      for (let sq = 0; sq < 64; sq++) {
        const m = rookAttacks(sq, occ);
        expect(m).toBe(rookBruteForce(sq, occ));
      }
    }
  });
});

describe("bishopAttacks vs brute force", () => {
  test("matches brute-force for empty occupancy on all squares", () => {
    const occ = 0n;
    for (let sq = 0; sq < 64; sq++) {
      expect(bishopAttacks(sq, occ)).toBe(bishopBruteForce(sq, occ));
    }
  });

  test("matches brute-force for single blocker anywhere", () => {
    for (let blocker = 0; blocker < 64; blocker++) {
      const occ = 1n << BigInt(blocker);
      for (let sq = 0; sq < 64; sq++) {
        expect(bishopAttacks(sq, occ)).toBe(bishopBruteForce(sq, occ));
      }
    }
  });
});

function rookBruteForce(sq: Square, occ: bigint): bigint {
  let mask = 0n;

  mask |= slide(sq, { dr: 1, dc: 0 }, occ);
  mask |= slide(sq, { dr: -1, dc: 0 }, occ);
  mask |= slide(sq, { dr: 0, dc: 1 }, occ);
  mask |= slide(sq, { dr: 0, dc: -1 }, occ);

  return mask;
}

function bishopBruteForce(sq: Square, occ: bigint): bigint {
  let mask = 0n;

  mask |= slide(sq, { dr: 1, dc: 1 }, occ);
  mask |= slide(sq, { dr: -1, dc: 1 }, occ);
  mask |= slide(sq, { dr: -1, dc: -1 }, occ);
  mask |= slide(sq, { dr: 1, dc: -1 }, occ);

  return mask;
}

type Direction = { dr: number; dc: number };
function slide(from: Square, dir: Direction, occ: bigint): bigint {
  let mask = 0n;

  let currRow = getRank(from) + dir.dr;
  let currCol = getFile(from) + dir.dc;
  while (0 <= currRow && currRow < 8 && currCol >= 0 && currCol < 8) {
    const sqMask = 1n << BigInt(currRow * 8 + currCol);
    mask |= sqMask;

    if (sqMask & occ) {
      break;
    }

    currRow += dir.dr;
    currCol += dir.dc;
  }

  return mask;
}
