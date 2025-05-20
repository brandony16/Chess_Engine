import { generateBlockerSubsets } from "./attackTable";
import { rookMasks } from "./generateMasks";
import { rookMagics, rookShifts } from "./magicNumbers";

// A helper to generate a random BigInt with few bits set
function randomMagicCandidate() {
  let m = 0n;
  // set ~8 random bits
  for (let j = 0; j < 8; j++) {
    const bit = BigInt(Math.floor(Math.random() * 64));
    m |= 1n << bit;
  }
  return m;
}

export function findNewRookMagic(sq, maxTries = 1e6) {
  const mask     = rookMasks[sq];
  const bits     = mask.toString(2).split('1').length - 1;
  const subsetCt = 1 << bits;
  const shift    = 64 - bits;

  for (let t = 0; t < maxTries; t++) {
    const magic = randomMagicCandidate();
    const seen  = new Set();
    let ok     = true;

    const blockers = generateBlockerSubsets(mask);
    for (let i = 0; i < subsetCt; i++) {
      const blocker = blockers[i];
      const idx      = Number(((blocker & mask) * magic) >> BigInt(shift));
      if (seen.has(idx)) { ok = false; break; }
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

export function findRookCollision(sq) {
  const mask     = rookMasks[sq];
  const bits     = mask.toString(2).split('1').length - 1;       // N relevant bits :contentReference[oaicite:0]{index=0}
  const subsetCt = 1 << bits;
  const seen     = new Map();

  for (let i = 0; i < subsetCt; i++) {
    // build blocker bitboard from i (reuse your maskBits/generateBlockerSubsets logic)
    const blockers = generateBlockerSubsets(mask)[i];
    const idx      = Number(((blockers & mask) * rookMagics[sq]) >> BigInt(rookShifts[sq]));
    if (seen.has(idx)) {
      console.error(`Collision on sq ${sq}: subsets ${seen.get(idx)} and ${i} → idx ${idx}`);
      return {collision: true, first: seen.get(idx), second: i};
    }
    seen.set(idx, i);
  }
  return {collision: false};
}