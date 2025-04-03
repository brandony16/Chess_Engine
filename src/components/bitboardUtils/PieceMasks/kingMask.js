import { isOnBoard } from "../bbUtils";

const KING_OFFSETS = [1, 7, 8, 9, -1, -7, -8, -9];

const computeKingMask = (square) => {
  let mask = 0n;

  for (const offset of KING_OFFSETS) {
    const target = square + offset;
    if (isOnBoard(target) && isValidKingMove(square, target)) {
      mask |= 1n << BigInt(target);
    }
  }
  return mask;
};

const isValidKingMove = (source, dest) => {
  // Compute rank and file for source and destination:
  const sourceFile = source % 8;
  const destFile = dest % 8;

  const fileDiff = Math.abs(sourceFile - destFile);

  // King can move one or two files.
  // Row wrapping is handled by isOnBoard
  if (fileDiff !== 1 && fileDiff !== 0) {
    return false;
  }
  return true;
};

const initializeKingMasks = () => {
  const kingMasks = new Array(64);

  for (let sq = 0; sq < 64; sq++) {
    kingMasks[sq] = computeKingMask(sq);
  }
  
  return kingMasks;
};

export const kingMasks = initializeKingMasks();