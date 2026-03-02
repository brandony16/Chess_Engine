import { NUM_PIECES, PIECE_SYMBOLS, PIECES } from "./game/chessConstants.ts";

/**
 * Converts a big int to an 8x8 grid of 1s and 0s.
 * Used for debugging to be able to see what bits are and aren't flipped.
 */
export function bigIntFullRep(bitboard: bigint): String {
  let boardStr = "";

  for (let rank = 7; rank >= 0; rank--) {
    // Ranks go from 8 (top) to 1 (bottom)
    let row = "";
    for (let file = 0; file < 8; file++) {
      // Files go from A (left) to H (right)
      let square = BigInt(1) << BigInt(rank * 8 + file);
      row += bitboard & square ? "1 " : "0 ";
    }
    boardStr += row.trim() + "\n"; // Add each row to the board string
  }

  return boardStr;
}

/**
 * Determines if two bitboard arrays are equal.
 */
export function areBigUint64ArraysEqual(
  a: BigUint64Array,
  b: BigUint64Array,
): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

/**
 * Logs all of the bitboards to the console in a readable format
 * with bigIntFullRep.
 */
export function logAllBitboards(bitboards: BigUint64Array): void {
  for (const piece of PIECES) {
    const bitboard = bitboards[piece];
    console.log(PIECE_SYMBOLS[piece] + "\n");
    console.log(bigIntFullRep(bitboard) + "\n\n");
  }
}

export const ENGINE_STATS = {
  // Transposition Table Stats
  ttHits: 0,
  ttExactHits: 0,
  ttCutoffHits: 0,
  ttMoveUsed: 0,

  // Killer Moves
  killerHits: 0,
  killerUpdates: 0,

  // History
  historyHits: 0,
  maxHistoryVal: 0,
  historyUpdates: 0,

  // Misc
  nodes: 0,
  betaCuts: 0,

  // ----- Quiesce Stats ------
  quiesceBetaCuts: 0,
  quiesceNodes: 0,

  // TT
  quiesceTtHits: 0,
  quiesceTtExactHits: 0,
  quiesceTtCutoffHits: 0,
  quiesceTtMoveUsed: 0,
};
