/**
 * Computes a white pawn attack mask for a square.
 *
 * @param {number} square - the square of the white pawn
 * @returns {bigint} the white pawn attack mask
 */
const computeWhitePawnMask = (square) => {
  const pawn = 1n << BigInt(square);
  let attacks = 0n;

  if (square % 8 !== 0) {
    // not on file A
    attacks |= pawn << 7n;
  }
  if (square % 8 !== 7) {
    // not on file H
    attacks |= pawn << 9n;
  }
  return attacks;
};

/**
 * Computes a black pawn attack mask for a square.
 *
 * @param {number} square - the square of the black pawn
 * @returns {bigint} the black pawn attack mask
 */
const computeBlackPawnMask = (square) => {
  const pawn = 1n << BigInt(square);
  let attacks = 0n;

  if (square % 8 !== 0) {
    // not on file A
    attacks |= pawn >> 9n;
  }
  if (square % 8 !== 7) {
    // not on file H
    attacks |= pawn >> 7n;
  }
  return attacks;
};

/**
 * Calculates the white pawn attack maps for every square on the board.
 * @returns {Array} an array of every white pawn attack mask
 */
const initializeWPawnAttackMasks = () => {
  const whitePawnMasks = new Array(64);
  for (let sq = 0; sq < 64; sq++) {
    whitePawnMasks[sq] = computeWhitePawnMask(sq);
  }

  return whitePawnMasks;
};

// The white pawn attack masks
export const whitePawnMasks = initializeWPawnAttackMasks();

/**
 * Calculates the black pawn attack maps for every square on the board.
 * @returns {Array} an array of every black pawn attack mask
 */
const initializeBPawnAttackMasks = () => {
  const blackPawnMasks = new Array(64);
  for (let sq = 0; sq < 64; sq++) {
    blackPawnMasks[sq] = computeBlackPawnMask(sq);
  }

  return blackPawnMasks;
};

// The white pawn attack masks
export const blackPawnMasks = initializeBPawnAttackMasks();
