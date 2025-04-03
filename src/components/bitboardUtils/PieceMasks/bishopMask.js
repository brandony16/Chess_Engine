import { getFile, getRank } from "../bbHelpers";

const  computeBishopMask = (square) => {
  let mask = 0n;
  const rank = getRank(square);
  const file = getFile(square);

  // North-East
  for (let r = rank + 1, f = file + 1; r < 8 && f < 8; r++, f++) {
    mask |= 1n << BigInt(r * 8 + f);
  }
  // North-West
  for (let r = rank + 1, f = file - 1; r < 8 && f >= 0; r++, f--) {
    mask |= 1n << BigInt(r * 8 + f);
  }
  // South-East
  for (let r = rank - 1, f = file + 1; r >= 0 && f < 8; r--, f++) {
    mask |= 1n << BigInt(r * 8 + f);
  }
  // South-West
  for (let r = rank - 1, f = file - 1; r >= 0 && f >= 0; r--, f--) {
    mask |= 1n << BigInt(r * 8 + f);
  }
  return mask;
}

const initializeBishopMasks = () => {
  const bishopMasks = new Array(64);

  for (let sq = 0; sq < 64; sq++) {
    bishopMasks[sq] = computeBishopMask(sq);
  }

  return bishopMasks;
};

export const bishopMasks = initializeBishopMasks();