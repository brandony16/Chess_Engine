import { describe, expect, test } from "vitest";
import { maskBits } from "../../../game/helpers/bbUtils.ts";
import {
  rookAttacks,
  bishopAttacks,
} from "../../../game/moveGen/sliderMoves.ts";
import { generateBlockerSubsets } from "../../../game/moveGen/magicNumbers/magicGen.ts";
import { sq, type Square } from "../../../game/chessConstants.ts";
import { getFile, getRank } from "../../../game/helpers/boardUtils.ts";
import { squareBB, type Bitboard } from "../../../game/bb.ts";

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
    const [occLo, occHi] = [0, 0];
    for (const s of Object.values(sq)) {
      const m = rookAttacks(s, occLo, occHi);
      expect(m).toEqual(rookBruteForce(s, occLo, occHi));
    }
  });

  test("matches brute-force for single blocker anywhere", () => {
    for (let blocker = 0; blocker < 64; blocker++) {
      const [occLo, occHi] = squareBB(blocker);
      for (const s of Object.values(sq)) {
        const m = rookAttacks(s, occLo, occHi);
        expect(m).toEqual(rookBruteForce(s, occLo, occHi));
      }
    }
  });
});

describe("bishopAttacks vs brute force", () => {
  test("matches brute-force for empty occupancy on all squares", () => {
    const [occLo, occHi] = [0, 0];
    for (const s of Object.values(sq)) {
      const m = bishopAttacks(s, occLo, occHi);
      expect(m).toEqual(bishopBruteForce(s, occLo, occHi));
    }
  });

  test("matches brute-force for single blocker anywhere", () => {
    for (let blocker = 0; blocker < 64; blocker++) {
      const [occLo, occHi] = squareBB(blocker);
      for (const s of Object.values(sq)) {
        const m = bishopAttacks(s, occLo, occHi);
        expect(m).toEqual(bishopBruteForce(s, occLo, occHi));
      }
    }
  });
});

function rookBruteForce(sq: Square, occLo: number, occHi: number): Bitboard {
  let maskLo = 0,
    maskHi = 0;

  const [upLo, upHi] = slide(sq, { dr: 1, dc: 0 }, occLo, occHi);
  const [downLo, downHi] = slide(sq, { dr: -1, dc: 0 }, occLo, occHi);
  const [rightLo, rightHi] = slide(sq, { dr: 0, dc: 1 }, occLo, occHi);
  const [leftLo, leftHi] = slide(sq, { dr: 0, dc: -1 }, occLo, occHi);

  maskLo |= upLo | downLo | rightLo | leftLo;
  maskHi |= upHi | downHi | rightHi | leftHi;

  return [maskLo >>> 0, maskHi >>> 0];
}

function bishopBruteForce(sq: Square, occLo: number, occHi: number): Bitboard {
  let maskLo = 0,
    maskHi = 0;

  const [neLo, neHi] = slide(sq, { dr: 1, dc: 1 }, occLo, occHi);
  const [seLo, seHi] = slide(sq, { dr: -1, dc: 1 }, occLo, occHi);
  const [swLo, swHi] = slide(sq, { dr: -1, dc: -1 }, occLo, occHi);
  const [nwLo, nwHi] = slide(sq, { dr: 1, dc: -1 }, occLo, occHi);

  maskLo |= neLo | seLo | swLo | nwLo;
  maskHi |= neHi | seHi | swHi | nwHi;

  return [maskLo >>> 0, maskHi >>> 0];
}

type Direction = { dr: number; dc: number };
function slide(
  from: Square,
  dir: Direction,
  occLo: number,
  occHi: number,
): Bitboard {
  let maskLo = 0,
    maskHi = 0;

  let currRow = getRank(from) + dir.dr;
  let currCol = getFile(from) + dir.dc;
  while (0 <= currRow && currRow < 8 && currCol >= 0 && currCol < 8) {
    const [lo, hi] = squareBB(currRow * 8 + currCol);
    maskLo |= lo;
    maskHi |= hi;

    // ran into piece - stop slide
    if (lo & occLo || hi & occHi) {
      break;
    }

    currRow += dir.dr;
    currCol += dir.dc;
  }

  return [maskLo, maskHi];
}
