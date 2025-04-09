import { isOnBoard } from "../bbUtils";

// The king square offsets
const KING_OFFSETS = [1, 7, 8, 9, -1, -7, -8, -9];

/**
 * Computes a king move mask for a square. Does not do castling.
 * 
 * @param {number} square - the square of the king
 * @returns {bigint} the king move mask
 */
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

/**
 * Determines whether a king move wraps around the board. Returns false if it does.
 * @param {number} source - the square the king moves from
 * @param {number} dest - the square the king moves to
 * @returns {boolean} if it is valid
 */
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

/**
 * Initializes an array of king masks for every square.
 * @returns {Array} the king masks
 */
const initializeKingMasks = () => {
  const kingMasks = new Array(64);

  for (let sq = 0; sq < 64; sq++) {
    kingMasks[sq] = computeKingMask(sq);
  }
  
  return kingMasks;
};

// The king masks
export const kingMasks = initializeKingMasks();