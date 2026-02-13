import { generateBlockerSubsets } from "../../../coreLogic/helpers/bbUtils.mjs";
import { bishopMasks, rookMasks } from "./slidingMasks.ts";
import {
  bishopMagics,
  bishopShifts,
  rookMagics,
  rookShifts,
} from "./magicNumbers.ts";
import type { CollisionResolution } from "./magicTypes.ts";
import type { Square } from "../../chessConstants.ts";

/**
 * Generates random magic number candidates with 10 random bits set.
 */
function randomMagicCandidate(): bigint {
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
 */
export function findNewRookMagic(sq: Square, maxTries: number = 1e6): bigint {
  for (let t = 0; t < maxTries; t++) {
    const magic = randomMagicCandidate();
    const collision = findRookCollision(sq, magic);

    if (collision.collision === false) {
      console.log(`Found new rookMagic for sq ${sq}: 0x${magic.toString(16)}`);
      console.log(magic);
      return magic;
    }

    if (t % 10000 === 0) {
      console.log("Magic Number " + t + " processed");
    }
  }
  throw new Error(`No magic found after ${maxTries} tries for sq ${sq}`);
}

export function recalculateAllRookMagics(maxTries: number = 1e6): bigint[] {
  const newMagics = new Array(64);
  for (let i = 0; i < 64; i++) {
    const magic = findNewRookMagic(i, maxTries);
    newMagics[i] = `0x${magic.toString(16)}`;
  }
  return newMagics;
}

/**
 * Generates a new magic number for a bishop using brute-force guess and check. Checks
 * the candidate magic number with every permutation of blockers, ensuring that no
 * collisions occur.
 */
export function findNewBishopMagic(sq: Square, maxTries: number = 1e6): bigint {
  for (let t = 0; t < maxTries; t++) {
    const magic = randomMagicCandidate();
    const collision = findBishopCollision(sq, magic);

    if (collision.collision === false) {
      console.log(`Found new rookMagic for sq ${sq}: 0x${magic.toString(16)}`);
      console.log(magic);
      return magic;
    }

    if (t % 10000 === 0) {
      console.log("Magic Number " + t + " processed");
    }
  }
  throw new Error(`No magic found after ${maxTries} tries for sq ${sq}`);
}

/**
 * Recalculates new magic numbers for each square for bishops.
 */
export function recalculateAllBishopMagics(maxTries: number = 1e6): bigint[] {
  const newMagics = new Array(64);
  for (let i = 0; i < 64; i++) {
    const magic = findNewBishopMagic(i, maxTries);
    newMagics[i] = `0x${magic.toString(16)}`;
  }
  return newMagics;
}

/**
 * Determines if a collision is occuring at a given square for the rook magic numbers
 */
export function findRookCollision(
  sq: Square,
  magic: bigint = null,
): CollisionResolution {
  const mask = rookMasks[sq];
  const seen = new Map();
  const magicNum = magic ? magic : rookMagics[sq];

  for (const blockers of generateBlockerSubsets(mask)) {
    const idx = Number(
      BigInt.asUintN(64, (blockers & mask) * magicNum) >>
        BigInt(rookShifts[sq]),
    );
    if (seen.has(idx)) {
      return { collision: true, first: seen.get(idx), second: blockers };
    }
    seen.set(idx, blockers);
  }
  return { collision: false };
}

/**
 * Determines if a collision is occuring at a given square for the rook magic numbers
 * @param {number} sq - the square to check for a collition
 * @returns {{collision:boolean, first: number, second: number}} if a collision was found and where
 */
export function findBishopCollision(
  sq: Square,
  magic: bigint = null,
): CollisionResolution {
  const mask = bishopMasks[sq];
  const seen = new Map();
  const magicNum = magic ? magic : bishopMagics[sq];

  for (const blockers of generateBlockerSubsets(mask)) {
    const idx = Number(
      BigInt.asUintN(64, (blockers & mask) * magicNum) >>
        BigInt(bishopShifts[sq]),
    );
    if (seen.has(idx)) {
      return { collision: true, first: seen.get(idx), second: blockers };
    }
    seen.set(idx, blockers);
  }
  return { collision: false };
}
