// masks.test.ts
import { describe, it, expect } from "vitest";
import { bbToBigInt } from "../../game/bb.ts";
import {
  betweenMaskHi,
  betweenMaskLo,
  lineMaskHi,
  lineMaskLo,
} from "../../game/attackMasks/masks.ts";

describe("betweenMask", () => {
  it("a1 to h1 contains b1-g1", () => {
    const idx = 0 * 64 + 7; // sq1=0 (a1), sq2=7 (h1)
    const lo = betweenMaskLo[idx];
    const hi = betweenMaskHi[idx];
    // squares 1-6 (b1-g1) should be set, not 0 or 7
    for (let sq = 1; sq <= 6; sq++) expect(lo & (1 << sq)).toBeTruthy();
    expect(lo & 1).toBe(0); // a1 excluded
    expect(lo & (1 << 7)).toBe(0); // h1 excluded
  });

  it("non-aligned squares return empty", () => {
    const idx = 0 * 64 + 17; // a1 to b3 — not aligned
    expect(betweenMaskLo[idx]).toBe(0);
    expect(betweenMaskHi[idx]).toBe(0);
  });

  it("same square returns empty", () => {
    for (let sq = 0; sq < 64; sq++) {
      const idx = sq * 64 + sq;
      expect(betweenMaskLo[idx]).toBe(0);
      expect(betweenMaskHi[idx]).toBe(0);
    }
  });

  it("is symmetric", () => {
    for (let sq1 = 0; sq1 < 64; sq1++) {
      for (let sq2 = 0; sq2 < 64; sq2++) {
        const fwd = bbToBigInt(
          betweenMaskLo[sq1 * 64 + sq2],
          betweenMaskHi[sq1 * 64 + sq2],
        );
        const bwd = bbToBigInt(
          betweenMaskLo[sq2 * 64 + sq1],
          betweenMaskHi[sq2 * 64 + sq1],
        );
        expect(fwd).toBe(bwd);
      }
    }
  });
});

describe("lineMask", () => {
  it("e1 to e4 contains full e-file", () => {
    // e1=4, e4=28 — same file, lineMask should be entire e-file
    const idx = 4 * 64 + 28;
    const lo = lineMaskLo[idx];
    const hi = lineMaskHi[idx];
    // All e-file squares: 4,12,20,28,36,44,52,60
    for (const sq of [4, 12, 20, 28, 36, 44, 52, 60]) {
      if (sq < 32) expect(lo & (1 << sq)).toBeTruthy();
      else expect(hi & (1 << (sq - 32))).toBeTruthy();
    }
  });

  it("non-aligned squares return empty", () => {
    const idx = 0 * 64 + 17;
    expect(lineMaskLo[idx]).toBe(0);
    expect(lineMaskHi[idx]).toBe(0);
  });

  it("is symmetric", () => {
    for (let sq1 = 0; sq1 < 64; sq1++) {
      for (let sq2 = 0; sq2 < 64; sq2++) {
        const fwd = bbToBigInt(
          lineMaskLo[sq1 * 64 + sq2],
          lineMaskHi[sq1 * 64 + sq2],
        );
        const bwd = bbToBigInt(
          lineMaskLo[sq2 * 64 + sq1],
          lineMaskHi[sq2 * 64 + sq1],
        );
        expect(fwd).toBe(bwd);
      }
    }
  });

  it("lineMask always contains betweenMask", () => {
    for (let sq1 = 0; sq1 < 64; sq1++) {
      for (let sq2 = 0; sq2 < 64; sq2++) {
        const idx = sq1 * 64 + sq2;
        const blo = betweenMaskLo[idx],
          bhi = betweenMaskHi[idx];
        const llo = lineMaskLo[idx],
          lhi = lineMaskHi[idx];
        // betweenMask must be a subset of lineMask
        expect(blo & llo).toBe(blo);
        expect(bhi & lhi).toBe(bhi);
      }
    }
  });
});
