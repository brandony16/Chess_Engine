export const FILE_MASKS = new Uint32Array([
  0x01010101, // File A
  0x02020202, // File B
  0x04040404, // File C
  0x08080808, // File D
  0x10101010, // File E
  0x20202020, // File F
  0x40404040, // File G
  0x80808080, // File H
]);

export const ADJACENT_FILE_MASKS = new Uint32Array(8);

for (let i = 0; i < 8; i++) {
  let mask = 0;
  if (i > 0) mask |= FILE_MASKS[i - 1]; // Left adjacent file
  if (i < 7) mask |= FILE_MASKS[i + 1]; // Right adjacent file
  ADJACENT_FILE_MASKS[i] = mask;
}

// passed pawn masks
export const W_PASSED_LO = new Uint32Array(64);
export const W_PASSED_HI = new Uint32Array(64);
export const B_PASSED_LO = new Uint32Array(64);
export const B_PASSED_HI = new Uint32Array(64);

function initPassedPawnMasks() {
  for (let sq = 0; sq < 64; sq++) {
    const file = sq & 7;
    const rank = sq >> 3;

    let wLo = 0,
      wHi = 0;
    let bLo = 0,
      bHi = 0;

    // White passed pawn mask (look forward to rank 8)
    for (let r = rank + 1; r < 8; r++) {
      // Span across the file to the left, the current file, and the right
      for (let f = Math.max(0, file - 1); f <= Math.min(7, file + 1); f++) {
        const targetSq = r * 8 + f;
        if (targetSq < 32) wLo |= 1 << targetSq;
        else wHi |= 1 << (targetSq - 32);
      }
    }

    // Black passed pawn mask (look backward to rank 1)
    for (let r = rank - 1; r >= 0; r--) {
      for (let f = Math.max(0, file - 1); f <= Math.min(7, file + 1); f++) {
        const targetSq = r * 8 + f;
        if (targetSq < 32) bLo |= 1 << targetSq;
        else bHi |= 1 << (targetSq - 32);
      }
    }

    W_PASSED_LO[sq] = wLo >>> 0;
    W_PASSED_HI[sq] = wHi >>> 0;
    B_PASSED_LO[sq] = bLo >>> 0;
    B_PASSED_HI[sq] = bHi >>> 0;
  }
}

initPassedPawnMasks();
