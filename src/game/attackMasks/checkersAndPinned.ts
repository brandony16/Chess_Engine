export const betweenMask: bigint[][] = (() => {
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

// Full line through both squares in both directions
export const lineMask: bigint[][] = (() => {
  const table: bigint[][] = Array.from({ length: 64 }, () =>
    new Array(64).fill(0n),
  );
  for (let sq1 = 0; sq1 < 64; sq1++) {
    for (let sq2 = 0; sq2 < 64; sq2++) {
      if (sq1 === sq2) continue;
      const between = betweenMask[sq1][sq2];
      if (between === 0n && !onSameRay(sq1, sq2)) continue;
      // Extend the ray fully in both directions across the whole board
      table[sq1][sq2] = fullRay(sq1, sq2);
    }
  }
  return table;
})();

export function moreThanOne(bb: bigint): boolean {
  return (bb & (bb - 1n)) !== 0n; // clears LSB — if anything remains, >1 bit set
}

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
