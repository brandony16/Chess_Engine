import { bitScanForward, isKing } from "../bbUtils";
import { blackPawnMasks, whitePawnMasks } from "./pawnMask";
import { knightMasks } from "./knightMask";
import { computeHash, zobristTable } from "../zobristHashing";
import { getPieceAtSquare } from "../pieceGetters";
import { LRUMap } from "../LRUMap";
import {
  BLACK,
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  PLAYER_ZOBRIST,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../constants";
import {
  getBishopAttacksForSquare,
  getQueenAttacksForSquare,
  getRookAttacksForSquare,
} from "../moveGeneration/slidingPieceAttacks";
import { kingMasks } from "./kingMask";

/**
 * Computes an attack mask for a player
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {number} player - whose attack mask it is (0 for w, 1 for b)
 * @returns {bigint} the attack mask for the player
 */
export const computeAttackMask = (bitboards, player) => {
  const one = 1n;
  let attackMask = 0n;
  let pawnBB = bitboards[WHITE_PAWN];
  let knightBB = bitboards[WHITE_KNIGHT];
  let bishopBB = bitboards[WHITE_BISHOP];
  let rookBB = bitboards[WHITE_ROOK];
  let queenBB = bitboards[WHITE_QUEEN];
  let kingBB = bitboards[WHITE_KING];
  let pawnMasks = whitePawnMasks;
  if (player === BLACK) {
    pawnBB = bitboards[BLACK_PAWN];
    knightBB = bitboards[BLACK_KNIGHT];
    bishopBB = bitboards[BLACK_BISHOP];
    rookBB = bitboards[BLACK_ROOK];
    queenBB = bitboards[BLACK_QUEEN];
    kingBB = bitboards[BLACK_KING];
    pawnMasks = blackPawnMasks;
  }

  while (pawnBB) {
    const lsBit = pawnBB & -pawnBB;
    const sq = bitScanForward(lsBit);
    attackMask |= pawnMasks[sq];
    pawnBB &= pawnBB - one;
  }

  while (knightBB) {
    const lsBit = knightBB & -knightBB;
    const sq = bitScanForward(lsBit);
    attackMask |= knightMasks[sq];
    knightBB &= knightBB - one;
  }

  while (bishopBB) {
    const lsBit = bishopBB & -bishopBB;
    const sq = bitScanForward(lsBit);
    attackMask |= getBishopAttacksForSquare(bitboards, sq);
    bishopBB &= bishopBB - one;
  }

  while (rookBB) {
    const lsBit = rookBB & -rookBB;
    const sq = bitScanForward(lsBit);
    attackMask |= getRookAttacksForSquare(bitboards, sq);
    rookBB &= rookBB - one;
  }

  while (queenBB) {
    const lsBit = queenBB & -queenBB;
    const sq = bitScanForward(lsBit);
    attackMask |= getQueenAttacksForSquare(bitboards, sq);
    queenBB &= queenBB - one;
  }

  while (kingBB) {
    const lsBit = kingBB & -kingBB;
    const sq = bitScanForward(lsBit);
    attackMask |= kingMasks[sq];
    kingBB &= kingBB - one;
  }

  return attackMask;
};

// Map of cached attack masks
export const attackMaskCache = new LRUMap(500_000);

/**
 * Gets a cached attack mask
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {number} player - whose attack mask it is (0 for w, 1 for b)
 * @param {bigint} hash - the hash of the mask to get. Computes it if no mask is found
 * @returns {bigint} the attack mask
 */
export const getCachedAttackMask = (bitboards, player, hash = null) => {
  if (attackMaskCache.has(hash)) {
    return attackMaskCache.get(hash);
  }
  const boardHash = computeHash(bitboards, player);
  const mask = computeAttackMask(bitboards, player);
  attackMaskCache.set(boardHash, mask);

  return mask;
};

/**
 * Updates the previous attack mask. Is much more efficient than recomputing it every time.
 *
 * @param {BigUint64Array} prevBitboards - the previous positions bitboards
 * @param {BigUint64Array} bitboards - the current positions bitboards
 * @param {number} from - the square moving from
 * @param {number} to - the square moving to
 * @param {bigint} prevHash - the previous hash
 * @param {number} player - the player to compute the attack mask for (0 for w, 1 for b)
 * @returns {bigint} a hash of the new attack map
 */
export const updateAttackMaskHash = (
  prevBitboards,
  bitboards,
  from,
  to,
  prevHash,
  player,
  enPassantSquare,
  isSamePlayer = false
) => {
  let newHash = prevHash;
  let pieceFrom = getPieceAtSquare(from, prevBitboards);

  // XOR the piece at the previous position
  const zobristFrom = zobristTable[pieceFrom * 64 + from];
  newHash ^= zobristFrom;

  // XOR the pieces new location
  const pieceTo = getPieceAtSquare(to, bitboards);
  const zobristTo = zobristTable[pieceTo * 64 + to];
  newHash ^= zobristTo;

  // if a capture, XOR to remove captured piece
  const prevPieceTo = getPieceAtSquare(to, prevBitboards);
  if (to === enPassantSquare) {
    // white EP: captured pawn is one rank down; black EP: one rank up
    const capSq = prevPieceTo <= 5 ? to - 8 : to + 8;
    const capPiece = getPieceAtSquare(capSq, prevBitboards);
    newHash ^= zobristTable[capPiece * 64 + capSq];
  } else if (prevPieceTo) {
    newHash ^= zobristTable[prevPieceTo * 64 + to];
  }

  // XOR player
  if (!isSamePlayer) {
    newHash ^= PLAYER_ZOBRIST;
  }

  if (Math.abs(from - to) === 2 && isKing(pieceFrom)) {
    newHash = handleCastleHashUpdate(newHash, from, to);
  }

  if (!attackMaskCache.has(newHash)) {
    const newMask = computeAttackMask(bitboards, player);
    attackMaskCache.set(newHash, newMask);
  }

  return newHash;
};

/**
 * Clears the attak mask cache
 */
export const clearAttackMaskCache = () => {
  attackMaskCache.clear();
};

/**
 * Handles updating the hash when castling occurs. Only moves the rook, as the king is handled by the updateAttackMaskHash
 * function when it XORs the piece at the from and to locations.
 *
 * @param {bigint} hash - the hash to update
 * @param {number} from - the square the king moved from
 * @param {number} to - the square the king moved t0
 * @returns {bigint} the updated hash
 */
const handleCastleHashUpdate = (hash, from, to) => {
  if (from !== 4 && from !== 60) return hash;

  let newHash = hash;

  // White castling
  if (from === 4) {
    const rookZobrist = WHITE_ROOK * 64;
    if (to === 6) {
      // Kingside
      const rookZobristFrom = zobristTable[rookZobrist + 7];
      const rookZobristTo = zobristTable[rookZobrist + 5];
      newHash ^= rookZobristFrom;
      newHash ^= rookZobristTo;
      return newHash;
    }
    // Queenside
    const rookZobristFrom = zobristTable[rookZobrist + 0];
    const rookZobristTo = zobristTable[rookZobrist + 3];
    newHash ^= rookZobristFrom;
    newHash ^= rookZobristTo;
    return newHash;
  }

  // Black caslting
  const rookZobrist = BLACK_ROOK * 64;

  if (to === 62) {
    // Kingside
    const rookZobristFrom = zobristTable[rookZobrist + 63];
    const rookZobristTo = zobristTable[rookZobrist + 61];
    newHash ^= rookZobristFrom;
    newHash ^= rookZobristTo;
    return newHash;
  }

  // Queenside
  const rookZobristFrom = zobristTable[rookZobrist + 56];
  const rookZobristTo = zobristTable[rookZobrist + 59];
  newHash ^= rookZobristFrom;
  newHash ^= rookZobristTo;
  return newHash;
};
