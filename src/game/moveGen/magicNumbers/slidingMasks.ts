import { bbFromBigInt } from "../../bb.ts";
import { sq, type File, type Rank, type Square } from "../../chessConstants.ts";

// Convert (file,rank) to bit index 0…63
function toIndex(file: File, rank: Rank): Square {
  return (rank * 8 + file) as Square;
}

// Generate rook mask for square sq
function computeRookMask(sq: Square): bigint {
  const file = sq % 8;
  const rank = Math.floor(sq / 8);

  let mask = 0n;
  // Directions: N, S, E, W
  const deltas = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];
  for (const [df, dr] of deltas) {
    let f = file + df;
    let r = rank + dr;

    while (f >= 0 && f < 8 && r >= 0 && r < 8) {
      // Break if next move is off of the board.
      const nextF = f + df;
      const nextR = r + dr;
      if (nextF >= 8 || nextF < 0 || nextR >= 8 || nextR < 0) break;

      mask |= 1n << BigInt(toIndex(f as File, r as Rank));
      f += df;
      r += dr;
    }
  }
  return mask;
}

// Generate bishop mask for square sq
function computeBishopMask(sq: Square): bigint {
  const file = sq % 8;
  const rank = Math.floor(sq / 8);

  let mask = 0n;
  // Directions: NE, NW, SE, SW
  const deltas = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ];
  for (const [df, dr] of deltas) {
    let f = file + df;
    let r = rank + dr;

    while (f > 0 && f < 7 && r > 0 && r < 7) {
      mask |= 1n << BigInt(toIndex(f as File, r as Rank));
      f += df;
      r += dr;
    }
  }
  return mask;
}

export const bishopMasksLo = new Int32Array(64);
export const bishopMasksHi = new Int32Array(64);
export const rookMasksLo = new Int32Array(64);
export const rookMasksHi = new Int32Array(64);

const generateBishopMasks = () => {
  for (const s of Object.values(sq)) {
    const [lo, hi] = bbFromBigInt(computeBishopMask(s));
    bishopMasksLo[s] = lo;
    bishopMasksHi[s] = hi;
  }
};

const generateRookMasks = () => {
  for (const s of Object.values(sq)) {
    const [lo, hi] = bbFromBigInt(computeRookMask(s));
    rookMasksLo[s] = lo;
    rookMasksHi[s] = hi;
  }
};

generateBishopMasks();
generateRookMasks();
