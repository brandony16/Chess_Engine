import {
  getBishops,
  getKings,
  getKnights,
  getPawns,
  getPlayerBoard,
  getQueens,
  getRooks,
} from "./pieceGetters.mjs";

/**
 * Gets the least valuable bit from a bitboard based off of material value.
 * Returns a single-bit BigInt mask (or 0n if none)
 * Order: pawn -> knight -> bishop -> rook -> queen -> king
 *
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {bigint} bb - the bitboard to get the least valuable bit from
 * @param {0 | 1} side - the side to get the bit from
 * @returns {bigint} - a bitboard with one bit set, the lvb
 */
export function getLeastValuableBit(bitboards, bb, side) {
  const playerBoard = getPlayerBoard(side, bitboards);
  const playerAttackers = bb & playerBoard;
  if (!playerAttackers) return 0n;

  const pawnAttackers = playerAttackers & getPawns(bitboards);
  if (pawnAttackers) return pawnAttackers & -pawnAttackers; // Return lsb

  const knightAttackers = playerAttackers & getKnights(bitboards);
  if (knightAttackers) return knightAttackers & -knightAttackers;

  const bishopAttackers = playerAttackers & getBishops(bitboards);
  if (bishopAttackers) return bishopAttackers & -bishopAttackers;

  const rookAttackers = playerAttackers & getRooks(bitboards);
  if (rookAttackers) return rookAttackers & -rookAttackers;

  const queenAttackers = playerAttackers & getQueens(bitboards);
  if (queenAttackers) return queenAttackers & -queenAttackers;

  const kingAttackers = playerAttackers & getKings(bitboards);
  if (kingAttackers) return kingAttackers & -kingAttackers;

  return 0n;
}
