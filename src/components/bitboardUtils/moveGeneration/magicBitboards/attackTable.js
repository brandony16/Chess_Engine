import { bitScanForward } from "../../bbUtils";
import { getBishopAttacksForSquare, getRookAttacksForSquare } from "../slidingPieceAttacks";
import { bishopMasks, rookMasks } from "./generateMasks";
import {
  bishopMagics,
  bishopShifts,
  rookMagics,
  rookShifts,
} from "./magicNumbers";

export function maskBits(mask) {
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
export const rookAttackTable = Array(64);
export const bishopAttackTable = Array(64);

export function generateBlockerSubsets(mask) {
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

for (let sq = 0; sq < 64; sq++) {
  const rMask = rookMasks[sq];
  const bMask = bishopMasks[sq];

  const rSize = 1 << (64 - rookShifts[sq]);
  const bSize = 1 << (64 - bishopShifts[sq]);

  rookAttackTable[sq] = new Array(rSize);
  bishopAttackTable[sq] = new Array(bSize);

  // Fill rook table
  {
    for (const blockers of generateBlockerSubsets(rMask)) {
      const idx = Number(
        ((blockers & rMask) * BigInt(rookMagics[sq])) >> BigInt(rookShifts[sq])
      );
      // Compute real rook attacks by scanning rays until blocker
      const attacks = getRookAttacksForSquare(blockers, sq);
      rookAttackTable[sq][idx] = attacks;
    }
  }

  // Fill bishop table (analogous)
  {
    for (const blockers of generateBlockerSubsets(bMask)) {
      const idx = Number(
        ((blockers & bMask) * BigInt(bishopMagics[sq])) >>
          BigInt(bishopShifts[sq])
      );
      const attacks = getBishopAttacksForSquare(blockers, sq);
      bishopAttackTable[sq][idx] = attacks;
    }
  }
}

export const bishopAttacks = (sq, occ) => {
  const mask = occ & bishopMasks[sq];
  const index = Number(
    (mask * BigInt(bishopMagics[sq])) >> BigInt(bishopShifts[sq])
  );

  return bishopAttackTable[sq][index];
};

export const rookAttacks = (sq, occ) => {
  const mask = occ & rookMasks[sq];
  const index = Number(
    (mask * BigInt(rookMagics[sq])) >> BigInt(rookShifts[sq])
  );

  return rookAttackTable[sq][index];
};