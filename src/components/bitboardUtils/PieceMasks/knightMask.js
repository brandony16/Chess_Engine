import { isOnBoard } from "../bbHelpers";

const KNIGHT_OFFSETS = [17, 15, 10, 6, -17, -15, -10, -6];

const computeKnightMask = (square) => {
  let mask = 0n;

  for (const offset of KNIGHT_OFFSETS) {
    const target = square + offset;
    if (isOnBoard(target) && isValidKnightMove(square, target)) {
      mask |= 1n << BigInt(target);
    }
  }
  return mask;
};

const isValidKnightMove = (source, dest) => {
  // Compute rank and file for source and destination:
  const sourceFile = source % 8;
  const destFile = dest % 8;

  const fileDiff = Math.abs(sourceFile - destFile);

  // Knights can move one or two files.
  // Row wrapping is handled by isOnBoard
  if (fileDiff !== 1 && fileDiff !== 2) {
    return false;
  }
  return true;
};

export const initializeKnightMasks = () => {
  const knightMasks = new Array(64);

  for (let sq = 0; sq < 64; sq++) {
    knightMasks[sq] = computeKnightMask(sq);
  }

  return knightMasks;
};
