import { bbFromBigInt } from "../bb.ts";

const betweenMaskBigInt: bigint[][] = (() => {
  const table: bigint[][] = Array.from({ length: 64 }, () =>
    new Array(64).fill(0n),
  );
  for (let sq1 = 0; sq1 < 64; sq1++) {
    for (let sq2 = 0; sq2 < 64; sq2++) {
      table[sq1][sq2] = computeBetween(sq1, sq2);
    }
  }
  return table;
})();

const lineMaskBigInt: bigint[][] = (() => {
  const table: bigint[][] = Array.from({ length: 64 }, () =>
    new Array(64).fill(0n),
  );
  for (let sq1 = 0; sq1 < 64; sq1++) {
    for (let sq2 = 0; sq2 < 64; sq2++) {
      if (sq1 === sq2) continue;
      const between = betweenMaskBigInt[sq1][sq2];
      if (between === 0n && !onSameRay(sq1, sq2)) continue;
      table[sq1][sq2] = fullRay(sq1, sq2);
    }
  }
  return table;
})();

export const betweenMaskLo = new Int32Array(64 * 64);
export const betweenMaskHi = new Int32Array(64 * 64);

export const lineMaskLo = new Int32Array(64 * 64);
export const lineMaskHi = new Int32Array(64 * 64);

function initMasks(verify = false) {
  for (let sq1 = 0; sq1 < 64; sq1++) {
    for (let sq2 = 0; sq2 < 64; sq2++) {
      const idx = sq1 * 64 + sq2;

      const [blo, bhi] = bbFromBigInt(betweenMaskBigInt[sq1][sq2]);
      betweenMaskLo[idx] = blo;
      betweenMaskHi[idx] = bhi;

      const [llo, lhi] = bbFromBigInt(lineMaskBigInt[sq1][sq2]);
      lineMaskLo[idx] = llo;
      lineMaskHi[idx] = lhi;

      if (verify) {
        // Re-derive bigint from new arrays and compare
        const bRecovered = BigInt(blo >>> 0) | (BigInt(bhi >>> 0) << 32n);
        const lRecovered = BigInt(llo >>> 0) | (BigInt(lhi >>> 0) << 32n);

        if (bRecovered !== betweenMaskBigInt[sq1][sq2]) {
          throw new Error(
            `betweenMask mismatch at sq1=${sq1} sq2=${sq2}\n` +
              `  expected: ${betweenMaskBigInt[sq1][sq2].toString(16)}\n` +
              `  got:      ${bRecovered.toString(16)}`,
          );
        }
        if (lRecovered !== lineMaskBigInt[sq1][sq2]) {
          throw new Error(
            `lineMask mismatch at sq1=${sq1} sq2=${sq2}\n` +
              `  expected: ${lineMaskBigInt[sq1][sq2].toString(16)}\n` +
              `  got:      ${lRecovered.toString(16)}`,
          );
        }
      }
    }
  }
}

// Run with verify=true to confirm correctness
initMasks();

function computeBetween(sq1: number, sq2: number): bigint {
  if (sq1 === sq2) return 0n;

  const file1 = sq1 & 7;
  const rank1 = sq1 >> 3;
  const file2 = sq2 & 7;
  const rank2 = sq2 >> 3;

  const fileDiff = file2 - file1;
  const rankDiff = rank2 - rank1;

  // Not on the same rank, file, or diagonal — no ray between them
  const onSameRank = rankDiff === 0;
  const onSameFile = fileDiff === 0;
  const onSameDiagonal = Math.abs(fileDiff) === Math.abs(rankDiff);

  if (!onSameRank && !onSameFile && !onSameDiagonal) return 0n;

  // Step direction: -1, 0, or 1 for each axis
  const fileStep = fileDiff === 0 ? 0 : fileDiff > 0 ? 1 : -1;
  const rankStep = rankDiff === 0 ? 0 : rankDiff > 0 ? 1 : -1;

  let mask = 0n;
  let file = file1 + fileStep;
  let rank = rank1 + rankStep;

  // Walk from sq1 toward sq2, excluding both endpoints
  while (file !== file2 || rank !== rank2) {
    mask |= 1n << BigInt(rank * 8 + file);
    file += fileStep;
    rank += rankStep;
  }

  return mask;
}

function onSameRay(sq1: number, sq2: number): boolean {
  const file1 = sq1 & 7,
    rank1 = sq1 >> 3;
  const file2 = sq2 & 7,
    rank2 = sq2 >> 3;

  const fileDiff = file2 - file1;
  const rankDiff = rank2 - rank1;

  return (
    rankDiff === 0 ||
    fileDiff === 0 ||
    Math.abs(fileDiff) === Math.abs(rankDiff)
  );
}

function fullRay(sq1: number, sq2: number): bigint {
  const file1 = sq1 & 7,
    rank1 = sq1 >> 3;
  const file2 = sq2 & 7,
    rank2 = sq2 >> 3;

  const fileDiff = file2 - file1;
  const rankDiff = rank2 - rank1;

  const fileStep = fileDiff === 0 ? 0 : fileDiff > 0 ? 1 : -1;
  const rankStep = rankDiff === 0 ? 0 : rankDiff > 0 ? 1 : -1;

  let mask = 0n;

  // Walk in positive direction from sq1 until off board
  let file = file1,
    rank = rank1;
  while (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
    mask |= 1n << BigInt(rank * 8 + file);
    file += fileStep;
    rank += rankStep;
  }

  // Walk in negative direction from sq1 until off board
  file = file1 - fileStep;
  rank = rank1 - rankStep;
  while (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
    mask |= 1n << BigInt(rank * 8 + file);
    file -= fileStep;
    rank -= rankStep;
  }

  return mask;
}
