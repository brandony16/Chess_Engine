export const isOnBoard = (sq) => {
  return sq >= 0 && sq < 64;
}

export function getRank(square) {
  return Math.floor(square / 8);
}

export function getFile(square) {
  return square % 8;
}