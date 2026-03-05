import type { File, Rank, Square } from "../../chessConstants.ts";

// Precompute masks
export const rookMasks = Array.from({ length: 64 }, (_, sq) =>
  generateRookMask(sq as Square),
);
export const bishopMasks = Array.from({ length: 64 }, (_, sq) =>
  generateBishopMask(sq as Square),
);

// Convert (file,rank) to bit index 0…63
function toIndex(file: File, rank: Rank): Square {
  return (rank * 8 + file) as Square;
}

// Generate rook mask for square sq
function generateRookMask(sq: Square): bigint {
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
function generateBishopMask(sq: Square): bigint {
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
