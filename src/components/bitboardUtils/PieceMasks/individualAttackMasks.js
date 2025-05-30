import {
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  INITIAL_BITBOARDS,
  NUM_PIECES,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../constants";
import {
  bishopAttacks,
  rookAttacks,
} from "../moveGeneration/magicBitboards/attackTable";
import { getAllPieces } from "../pieceGetters";
import { indexArrays } from "../pieceIndicies";
import { kingMasks } from "./kingMask";
import { knightMasks } from "./knightMask";
import { blackPawnMasks, whitePawnMasks } from "./pawnMask";

/**
 * Generates the attack bitboard of a piece at a square
 *
 * @param {bigint} occupancy - the occupancy bitboard
 * @param {number} piece - the piece to get attacks for
 * @param {number} square - the square the piece is at
 * @returns {bigint} - the attack bitboard
 */
export function attacksOf(occupancy, piece, square) {
  switch (piece) {
    case WHITE_PAWN:
      return whitePawnMasks[square];
    case BLACK_PAWN:
      return blackPawnMasks[square];
    case WHITE_KNIGHT:
    case BLACK_KNIGHT:
      return knightMasks[square];
    case WHITE_KING:
    case BLACK_KING:
      return kingMasks[square];
    case WHITE_BISHOP:
    case BLACK_BISHOP: {
      return bishopAttacks(square, occupancy);
    }
    case WHITE_ROOK:
    case BLACK_ROOK: {
      return rookAttacks(square, occupancy);
    }
    case WHITE_QUEEN:
    case BLACK_QUEEN: {
      return bishopAttacks(square, occupancy) | rookAttacks(square, occupancy);
    }
    default:
      return 0n;
  }
}

/**
 * Computes the attack mask for a given piece
 *
 * @param {BigUint64Array} bitboards - the bitboard of the position
 * @param {number} piece - the piece to compute the mask for
 * @returns {bigint} - the attack mask for the piece
 */
export function computeMaskForPiece(bitboards, piece, occupancy) {
  let mask = 0n;
  const indicies = indexArrays[piece];
  for (const square of indicies) {
    mask |= attacksOf(occupancy, piece, square);
  }

  return mask;
}

/**
 * Computes all attack masks and updates individualAttackMasks to avoid
 * constant recalculation.
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @returns {BigUint64Array} individualAttackMasks
 */
export function computeAllAttackMasks(bitboards) {
  const occupancy = getAllPieces(bitboards);
  for (let p = 0; p < NUM_PIECES; p++) {
    individualAttackMasks[p] = computeMaskForPiece(bitboards, p, occupancy);
  }

  return individualAttackMasks;
}

/**
 * An array of attack masks for each peice type. Used for more optimized
 * updating of attack masks to prevent recalculation every move.
 */
export const individualAttackMasks = new BigUint64Array(NUM_PIECES).fill(0n);
computeAllAttackMasks(INITIAL_BITBOARDS);
