import { isOnBoard } from "../helpers/bbUtils.mjs";

// The square offsets for a knight
const KNIGHT_OFFSETS = [17, 15, 10, 6, -17, -15, -10, -6];

/**
 * Computes a move mask for a knight at a square
 *
 * @param {number} square - the square of the knight
 * @returns {bigint} the knight move mask
 */
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

/**
 * Determines whether a knight move is valid. Meaning determines whether a move
 * wraps around the board.
 * @param {number} source - where the knight is moving from
 * @param {number} dest - where the knight is moving to
 * @returns {boolean} if the move is valid
 */
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

/**
 * Gets the knight move masks in an array, with each index corresponding to the square.
 * @returns {Array} the knight move masks
 */
const initializeKnightMasks = () => {
  const knightMasks = new Array(64);

  for (let sq = 0; sq < 64; sq++) {
    knightMasks[sq] = computeKnightMask(sq);
  }

  return knightMasks;
};

// The knight masks
export const knightMasks = initializeKnightMasks();
