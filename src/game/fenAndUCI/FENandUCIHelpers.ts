/**
 * Converts a uci move into a move object
 *
 * @param {string} uciMove - the uci move to get the move object for
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {0|1} player - the player whose move it is
 * @param {Array<boolean>} casRights - the castling rights
 * @param {number} epSquare - where en passant is legal
 * @returns {Move} the move
 */
export function uciToMove(uciMove, bitboards, player, casRights, epSquare) {
  const from = squareToIndex(uciMove.slice(0, 2));
  const to = squareToIndex(uciMove.slice(2, 4));
  let promotion =
    uciMove.length === 5
      ? player === WHITE
        ? uciMove[4].toUpperCase()
        : uciMove[4]
      : null;
  if (promotion) {
    promotion = PIECE_INDEXES[promotion];
  }

  const legalMoves = getAllLegalMoves(bitboards, player, casRights, epSquare);

  for (const move of legalMoves) {
    if (from === move.from && to === move.to && promotion === move.promotion) {
      return move;
    }
  }

  throw new Error("UCI move not found");
}

/**
 * Converts a move object into UCI notation
 * @param {Move} move - the move
 * @returns {string} - the move in uci form
 */
export function moveToUCI(move) {
  const from = indexToSquare(move.from);
  const to = indexToSquare(move.to);
  const promo = move.promotion
    ? GENERAL_SYMBOLS[move.promotion].toLowerCase()
    : "";

  return from + to + promo;
}

/**
 * Converts a string square into the index of that square.
 *
 * @param {string} square - string rep of the square (a3)
 * @returns {number} index of the square
 */
export function squareToIndex(square) {
  const col = square.charAt(0);
  const row = square.charAt(1);

  const rowNum = parseInt(row) - 1; // Rows arent 0 indexed
  const colNum = COLUMN_INDEXES[col];

  return rowNum * 8 + colNum;
}

/**
 * Gets a sequence of 8 opening moves (ply) for engines to play from.
 * Used so engines don't play the same game every time.
 * @returns {Array<String>} - 8 opening moves
 */
export async function getOpeningMoves() {
  const res = await fetch(`${import.meta.env.BASE_URL}openings.json`);
  if (!res.ok) throw new Error("Error fetching opening moves");

  const openings = await res.json();
  const randIndex = Math.floor(Math.random() * openings.length);

  return openings[randIndex];
}
