import { generateBlockerSubsets } from "./attackTable";
import { bishopMasks, rookMasks } from "./generateMasks";
import { bishopMagics, bishopShifts, rookMagics, rookShifts } from "./magicNumbers";

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

export function recalculateAllRookMagics(maxTries = 1e6) {
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
 *
 * @param {number} sq - the square
 * @param {number} maxTries - the maximum number of candidate magics to search through
 * @returns {bigint} a new magic number for a bishop at the given square
 * @throws An Error after it reaches maxTries and hasnt found a working magic number
 */
export function findNewBishopMagic(sq, maxTries = 1e6) {
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

export function recalculateAllBishopMagics(maxTries = 1e6) {
  const newMagics = new Array(64);
  for (let i = 0; i < 64; i++) {
    const magic = findNewBishopMagic(i, maxTries);
    newMagics[i] = `0x${magic.toString(16)}`;
  }
  return newMagics;
}

/**
 * Determines if a collision is occuring at a given square for the rook magic numbers
 * @param {number} sq - the square to check for a collition
 * @returns {{collision:boolean, first: number, second: number}} if a collision was found and where
 */
export function findRookCollision(sq, magic = null) {
  const mask = rookMasks[sq];
  const seen = new Map();
  const magicNum = magic ? magic : rookMagics[sq];


  for (const blockers of generateBlockerSubsets(mask)) {
    const idx = Number(
      BigInt.asUintN(64, (blockers & mask) * magicNum) >>
        BigInt(rookShifts[sq])
    );
    if (seen.has(idx)) {
      // console.error(
      //   `Collision on sq ${sq}: subsets ${seen.get(idx)} and ${blockers} → idx ${idx}`
      // );
      // console.log(bigIntFullRep(seen.get(idx)));
      // console.log(bigIntFullRep(blockers));

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
export function findBishopCollision(sq, magic = null) {
  const mask = bishopMasks[sq];
  const seen = new Map();
  const magicNum = magic ? magic : bishopMagics[sq];


  for (const blockers of generateBlockerSubsets(mask)) {
    const idx = Number(
      BigInt.asUintN(64, (blockers & mask) * magicNum) >>
        BigInt(bishopShifts[sq])
    );
    if (seen.has(idx)) {
      // console.error(
      //   `Collision on sq ${sq}: subsets ${seen.get(idx)} and ${blockers} → idx ${idx}`
      // );
      // console.log(bigIntFullRep(seen.get(idx)));
      // console.log(bigIntFullRep(blockers));

      return { collision: true, first: seen.get(idx), second: blockers };
    }
    seen.set(idx, blockers);
  }
  return { collision: false };
}