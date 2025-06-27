import {
  bishopAttacks,
  generateBlockerSubsets,
  maskBits,
  rookAttacks,
} from "../Core Logic/moveGeneration/magicBitboards/attackTable";
import {
  getBishopAttacksForSquare,
  getRookAttacksForSquare,
} from "../Core Logic/moveGeneration/slidingPieceAttacks";

describe("maskBits", () => {
  it("extracts correct bit positions", () => {
    // mask with bits at 0, 2, and 7
    const mask = (1n << 0n) | (1n << 2n) | (1n << 7n);
    const bits = maskBits(mask).sort((a, b) => a - b);
    expect(bits).toEqual([0, 2, 7]);
  });

  it("returns empty array for zero mask", () => {
    expect(maskBits(0n)).toEqual([]);
  });
});

describe("generateBlockerSubsets", () => {
  it("creates 2^N subsets for N mask bits", () => {
    // small mask: bits at 1 and 3 → N=2 → 4 subsets
    const mask = (1n << 1n) | (1n << 3n);
    const subs = generateBlockerSubsets(mask);
    expect(subs).toHaveLength(4);
    // should include 0, single-bit, and both bits
    const asStrings = subs.map((x) => x.toString());
    expect(asStrings).toEqual(
      expect.arrayContaining([
        "0",
        (1n << 1n).toString(),
        (1n << 3n).toString(),
        ((1n << 1n) | (1n << 3n)).toString(),
      ])
    );
  });
});

describe("rookAttacks vs brute force", () => {
  it("matches brute-force for empty occupancy on all squares", () => {
    const occ = 0n;
    for (let sq = 0; sq < 64; sq++) {
      const m = rookAttacks(sq, occ);
      expect(m).toBe(getRookAttacksForSquare(occ, sq));
    }
  });

  it("matches brute-force for single blocker anywhere", () => {
    for (let blocker = 0; blocker < 64; blocker++) {
      const occ = 1n << BigInt(blocker);
      for (let sq = 0; sq < 64; sq++) {
        const m = rookAttacks(sq, occ);
        expect(m).toBe(getRookAttacksForSquare(occ, sq));
      }
    }
  });
});

describe("bishopAttacks vs brute force", () => {
  it("matches brute-force for empty occupancy on all squares", () => {
    const occ = 0n;
    for (let sq = 0; sq < 64; sq++) {
      expect(bishopAttacks(sq, occ)).toBe(getBishopAttacksForSquare(occ, sq));
    }
  });

  it("matches brute-force for single blocker anywhere", () => {
    for (let blocker = 0; blocker < 64; blocker++) {
      const occ = 1n << BigInt(blocker);
      for (let sq = 0; sq < 64; sq++) {
        expect(bishopAttacks(sq, occ)).toBe(getBishopAttacksForSquare(occ, sq));
      }
    }
  });
});
