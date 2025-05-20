import { bitScanForward } from "../../bbUtils";
import { bishopMasks, rookMasks } from "./generateMasks";
import { bishopMagics, bishopShifts, rookMagics, rookShifts } from "./magicNumbers";

function maskBits(mask) {
  const bits = [];
  let b = mask;
  while (b) {
    const bitIndex = bitScanForward(b);
    bits.push(bitIndex);

    b &= b - 1n;
  }
  return bits;
}

// Attack tables: 64 squares × (1<<maxBits) entries
const rookAttackTable = Array(64);
const bishopAttackTable = Array(64);

for (let sq = 0; sq < 64; sq++) {
  const rMask = rookMasks[sq];
  const bMask = bishopMasks[sq];

  const rSize = 1 << (64 - rookShifts[sq]);
  const bSize = 1 << (64 - bishopShifts[sq]);

  rookAttackTable[sq] = new Array(rSize);
  bishopAttackTable[sq] = new Array(bSize);

  // Enumerate all blocker subsets via bit permutation
  function generateBlockerSubsets(mask) {
    const bits = maskBits(mask);
    const N = bits.length;
    const subsetCount = 1 << N;
    const subsets = new Array(subsetCount);

    for (let subset = 0; subset < subsetCount; subset++) {
      let blockboard = 0n;

      for (let i = 0; i < N; i++) {
        // If the i-th bit of 'subset' is set, include that blocker
        if (subset & (1 << i)) {
          const sq = bits[i];
          blockboard |= 1n << BigInt(sq);
        }
      }
      subsets[subset] = blockboard;
    }

    return subsets;
  }

  // Fill rook table
  {
    for (const blockers of generateBlockerSubsets(rMask)) {
      const idx = Number(
        ((blockers & rMask) * rookMagics[sq]) >> BigInt(rookShifts[sq])
      );
      // Compute real rook attacks by scanning rays until blocker
      let attacks = 0n;
      for (const [df, dr] of [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ]) {
        let f = (sq % 8) + df,
          r = (sq >> 3) + dr;
        while (f >= 0 && f < 8 && r >= 0 && r < 8) {
          const sq2 = r * 8 + f;
          attacks |= 1n << BigInt(sq2);
          if (blockers & (1n << BigInt(sq2))) break;
          f += df;
          r += dr;
        }
      }
      rookAttackTable[sq][idx] = attacks;
    }
  }

  // Fill bishop table (analogous)
  {
    for (const blockers of generateBlockerSubsets(bMask)) {
      const idx = Number(
        ((blockers & bMask) * bishopMagics[sq]) >> BigInt(bishopShifts[sq])
      );
      let attacks = 0n;
      for (const [df, dr] of [
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ]) {
        let f = (sq % 8) + df,
          r = (sq >> 3) + dr;
        while (f >= 0 && f < 8 && r >= 0 && r < 8) {
          const sq2 = r * 8 + f;
          attacks |= 1n << BigInt(sq2);
          if (blockers & (1n << BigInt(sq2))) break;
          f += df;
          r += dr;
        }
      }
      bishopAttackTable[sq][idx] = attacks;
    }
  }
}
