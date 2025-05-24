import { bitScanForward, popcount } from "../../bbUtils";
import { bigIntFullRep } from "../../debugFunctions";
import {
  getBishopAttacksForSquare,
  getRookAttacksForSquare,
} from "../slidingPieceAttacks";
import { bishopMasks, rookMasks } from "./generateMasks";
import { findRookCollision } from "./magicNumberRegen";
import {
  bishopMagics,
  bishopShifts,
  rookMagics,
  rookShifts,
} from "./magicNumbers";

/**
 * Gets the indexes of all of the set bits in a bitboard.
 *
 * @param {bigint} mask - the bitboard
 * @returns {Array<number>} an array of square indexes
 */
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

/**
 * Generates all blocker permutations for a given mask of moves for a peice.
 * For example, a rook on a1 can see the whole first row and first file. This
 * function generates all possible blocker permutations on the first row and file.
 * This will be 2^(N-1), with N being the number of set bits in the initial mask.
 *
 * @param {bigint} mask - the mask
 * @returns {BigUint64Array} the blocker subsets
 */
export function generateBlockerSubsets(mask) {
  const bits = maskBits(mask);
  const N = bits.length;
  const subsetCount = 1 << N;
  const subsets = new BigUint64Array(subsetCount);

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

// For every square, fill in the rook and bishop tables at that square.
for (let sq = 0; sq < 64; sq++) {
  const rMask = rookMasks[sq];
  const bMask = bishopMasks[sq];

  const rSize = 1 << (64 - rookShifts[sq]);
  const bSize = 1 << (64 - bishopShifts[sq]);

  rookAttackTable[sq] = new Array(rSize);
  bishopAttackTable[sq] = new Array(bSize);

  const seenR = new Array(rSize).fill(false);
  const seenB = new Array(bSize).fill(false);

  for (const blockers of generateBlockerSubsets(rMask)) {
    // step 1: mask out relevant bits
    const occMasked = blockers & rMask;

    // step 2: multiply by magic
    const product = BigInt.asUintN(64, occMasked * BigInt(rookMagics[sq]));

    // step 3: shift down
    const idxBig = product >> BigInt(rookShifts[sq]);
    const idx = Number(idxBig);

    // console.assert(
    //   idxBig < BigInt(rSize),
    //   `ROOK index out of range on sq ${sq}: idx=${idxBig}, max=${rSize - 1}`
    // );
    // console.assert(
    //   !seenR[idx],
    //   `ROOK collision on sq ${sq}, idx ${idx}: existing entry will be overwritten`
    // );
    seenR[idx] = true;
    // Compute real rook attacks by scanning rays until blocker
    const attacks = getRookAttacksForSquare(blockers, sq);

    rookAttackTable[sq][idx] = attacks;
  }

  for (let i = 0; i < rSize; i++) {
    console.assert(
      seenR[i],
      `ROOK table gap on sq ${sq}: slot ${i} was never filled`
    );
  }

  // Fill bishop table

  for (const blockers of generateBlockerSubsets(bMask)) {
    const idx = Number(
      BigInt.asUintN(64, (blockers & bMask) * BigInt(bishopMagics[sq])) >>
        BigInt(bishopShifts[sq])
    );
    const attacks = getBishopAttacksForSquare(blockers, sq);
    bishopAttackTable[sq][idx] = attacks;
  }
}

/**
 * Gets the attack mask for a bishop at a given square using
 * magic bitboards.
 *
 * @param {number} sq - the square where the bishop is
 * @param {bigint} occ - the occupancy bitboard
 * @returns {bigint} the attack mask for the bishop
 */
export function bishopAttacks(sq, occ) {
  const mask = occ & bishopMasks[sq];
  const index = Number(
    BigInt.asUintN(64, mask * bishopMagics[sq]) >> BigInt(bishopShifts[sq])
  );

  return bishopAttackTable[sq][index];
};

/**
 * Gets the attack mask for a rook at a given square using
 * magic bitboards.
 *
 * @param {number} sq - the square where the rook is
 * @param {bigint} occ - the occupancy bitboard
 * @returns {bigint} the attack mask for the rook
 */
export function rookAttacks(sq, occ) {
  const mask = occ & rookMasks[sq];

  const index = Number(
    BigInt.asUintN(64, mask * rookMagics[sq]) >> BigInt(rookShifts[sq])
  );

  return rookAttackTable[sq][index];
};

// function debugMagicForSquare(sq, isRook = true) {
//   const mask      = isRook ? rookMasks[sq] : bishopMasks[sq];
//   const magic     = isRook ? rookMagics[sq] : bishopMagics[sq];
//   const shift     = BigInt(isRook ? rookShifts[sq] : bishopShifts[sq]);
//   const bits      = popcount(mask);
//   const tableSize = 1 << bits;

//   // Map from index → array of blocker‐masks that hashed there:
//   const idxMap = new Map();
//   for (const blockers of generateBlockerSubsets(mask)) {
//     const occMasked = blockers & mask;
//     const product   = BigInt.asUintN(64, occMasked * BigInt(magic));
//     const idx       = Number(product >> shift);

//     if (!idxMap.has(idx)) idxMap.set(idx, []);
//     idxMap.get(idx).push(blockers);
//   }

//   // Report collisions
//   for (const [idx, arr] of idxMap.entries()) {
//     if (arr.length > 1) {
//       console.log(`sq ${sq} ${isRook ? 'rook' : 'bishop'}: COLLISION at idx ${idx}`);
//       arr.forEach((blk, i) =>
//         console.log(`  blocker #${i}:`, bigIntFullRep(blk))
//       );
//     }
//   }

//   // Report gaps
//   for (let i = 0; i < tableSize; i++) {
//     if (!idxMap.has(i)) {
//       console.log(`sq ${sq} ${isRook ? 'rook' : 'bishop'}: MISSING entry at idx ${i}`);
//     }
//   }
// }
