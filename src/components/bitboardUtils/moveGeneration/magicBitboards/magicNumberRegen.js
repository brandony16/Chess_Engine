import { popcount } from "../../bbUtils";
import { generateBlockerSubsets } from "./attackTable";
import { rookMasks } from "./generateMasks";
import { rookMagics, rookShifts } from "./magicNumbers";

/**
 * Generates random magic number candidates with 10 random bits set.
 * @returns {bigint} a random magic candidate
 */
function randomMagicCandidate() {
  let m = 0n;
  // set 10 random bits
  for (let j = 0; j < 10; j++) {
    const bit = BigInt(Math.floor(Math.random() * 64));
    m |= 1n << bit;
  }
  return m;
}

/**
 * Generates a new magic number for a rook using brute-force guess and check. Checks
 * the candidate magic number with every permutation of blockers, ensuring that no
 * collisions occur.
 *
 * @param {number} sq - the square
 * @param {number} maxTries - the maximum number of candidate magics to search through
 * @returns {bigint} a new magic number for a rook at the given square
 * @throws An Error after it reaches maxTries and hasnt found a working magic number
 */
export function findNewRookMagic(sq, maxTries = 1e6) {
  const mask = rookMasks[sq];
  const bits = popcount(mask);
  const subsetCt = 1 << bits;
  const shift = 64 - bits;

  for (let t = 0; t < maxTries; t++) {
    const magic = randomMagicCandidate();
    const seen = new Set();
    let ok = true;

    const blockers = generateBlockerSubsets(mask);
    for (let i = 0; i < subsetCt; i++) {
      const blocker = blockers[i];
      const idx = Number(((blocker & mask) * magic) >> BigInt(shift));
      if (seen.has(idx)) {
        ok = false;
        break;
      }
      seen.add(idx);
    }

    if (ok) {
      console.log(`Found new rookMagic for sq ${sq}: 0x${magic.toString(16)}`);
      return magic;
    }

    if (t % 1000 === 0) {
      console.log("Magic Number " + t + " processed");
    }
  }
  throw new Error(`No magic found after ${maxTries} tries for sq ${sq}`);
}

/**
 * Determines if a collision is occuring at a given square for the rook magic numbers
 * @param {number} sq - the square to check for a collition
 * @returns {{collision:boolean, first: number, second: number}} if a collision was found and where
 */
export function findRookCollision(sq) {
  const mask = rookMasks[sq];
  const bits = popcount(mask);
  const subsetCt = 1 << bits;
  const seen = new Map();

  for (let i = 0; i < subsetCt; i++) {
    // build blocker bitboard from i (reuse your maskBits/generateBlockerSubsets logic)
    const blockers = generateBlockerSubsets(mask)[i];
    const idx = Number(
      ((blockers & mask) * rookMagics[sq]) >> BigInt(rookShifts[sq])
    );
    if (seen.has(idx)) {
      console.error(
        `Collision on sq ${sq}: subsets ${seen.get(idx)} and ${i} → idx ${idx}`
      );
      return { collision: true, first: seen.get(idx), second: i };
    }
    seen.set(idx, i);
  }
  return { collision: false };
}
