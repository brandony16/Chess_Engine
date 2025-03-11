
export function isOnBoard(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Join each row into a string and then join the rows with a separator.
export function boardToKey(board) {
  return board.map(row => row.join('')).join('|');
}