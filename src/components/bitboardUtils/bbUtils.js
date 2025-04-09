/**
 * A helper to determine whether a square is on a board
 * @param {number} sq - the square
 * @returns {boolean} whether or not the square is on the board
 */
export const isOnBoard = (sq) => {
  return sq >= 0 && sq < 64;
};

/**
 * A helper to get the rank a square is on
 * @param {number} sq - the square on the board
 * @returns {number} the rank of the square
 */
export function getRank(sq) {
  return Math.floor(sq / 8);
}

/**
 * A helper to get the file a square is on
 * @param {number} sq - the square on the board
 * @returns {number} the file of the square
 */
export function getFile(sq) {
  return sq % 8;
}
