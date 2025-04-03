import { getFile, getRank } from "../bbHelpers"

const computeRookMask = (square) => {
  let mask = 0n;

  const rank = getRank(square);
  const file = getFile(square);

  for (let r = rank + 1; r < 8; r++) {
    mask |= 1n << BigInt(r * 8 + file);
  }
  for (let r = rank - 1; r >= 0; r--) {
    mask |= 1n << BigInt(r * 8 + file);
  }
  for (let f = file + 1; f < 8; f++) {
    mask |= 1n << BigInt(rank * 8 + f);
  }
  for (let f = file - 1; f >= 0; f--) {
    mask |= 1n << BigInt(rank * 8 + f);
  }
  return mask;
}

export const initializeRookMasks = () => {
  const rookMasks = new Array(64);

  for (let sq = 0; sq < 64; sq++) {
    rookMasks[sq] = computeRookMask(sq);
  }

  return rookMasks;
}