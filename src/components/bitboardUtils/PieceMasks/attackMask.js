import {
  bitScanForward,
  computeHash,
  getPieceAtSquare,
  pieceToZobristIndex,
  PLAYER_ZOBRIST,
  zobristTable,
} from "../bbHelpers";
import {
  getBishopMovesForSquare,
  getKingMovesForSquare,
  getQueenMovesForSquare,
  getRookMovesForSquare,
} from "../bbMoveGeneration";
import { knightMasks } from "./knightMask";
import { blackPawnMasks, whitePawnMasks } from "./pawnMask";

/**
 * @typedef {object} Bitboards
 * @property {bigint} whitePawns - bitboard of the white pawns
 * @property {bigint} whiteKnights - bitboard of the white knights
 * @property {bigint} whiteBishops - bitboard of the white bishops
 * @property {bigint} whiteRooks - bitboard of the white rooks
 * @property {bigint} whiteQueens - bitboard of the white queens
 * @property {bigint} whiteKings - bitboard of the white king
 * @property {bigint} blackPawns - bitboard of the black pawns
 * @property {bigint} blackKnights - bitboard of the black knights
 * @property {bigint} blackBishops - bitboard of the black bishops
 * @property {bigint} blackRooks - bitboard of the black rooks
 * @property {bigint} blackQueens - bitboard of the black queens
 * @property {bigint} blackKings - bitboard of the black king
 */

/**
 * Computes an attack mask for a player
 *
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {string} player - whose attack mask it is ("w" or "b")
 * @returns {bigint} the attack mask for the player
 */
const computeAttackMask = (bitboards, player) => {
  const one = 1n;
  let attackMask = 0n;

  if (player === "w") {
    let pawnBB = bitboards.whitePawns;
    while (pawnBB) {
      const lsBit = pawnBB & -pawnBB;
      const sq = bitScanForward(lsBit);
      attackMask |= whitePawnMasks[sq];
      pawnBB &= pawnBB - one;
    }

    let knightBB = bitboards.whiteKnights;
    while (knightBB) {
      const lsBit = knightBB & -knightBB;
      const sq = bitScanForward(lsBit);
      attackMask |= knightMasks[sq];
      knightBB &= knightBB - one;
    }

    let bishopBB = bitboards.whiteBishops;
    while (bishopBB) {
      const lsBit = bishopBB & -bishopBB;
      const sq = bitScanForward(lsBit);
      attackMask |= getBishopMovesForSquare(bitboards, player, sq);
      bishopBB &= bishopBB - one;
    }

    let rookBB = bitboards.whiteRooks;
    while (rookBB) {
      const lsBit = rookBB & -rookBB;
      const sq = bitScanForward(lsBit);
      attackMask |= getRookMovesForSquare(bitboards, player, sq);
      rookBB &= rookBB - one;
    }

    let queenBB = bitboards.whiteQueens;
    while (queenBB) {
      const lsBit = queenBB & -queenBB;
      const sq = bitScanForward(lsBit);
      attackMask |= getQueenMovesForSquare(bitboards, player, sq);
      queenBB &= queenBB - one;
    }

    let kingBB = bitboards.whiteKings;
    while (kingBB) {
      const lsBit = kingBB & -kingBB;
      const sq = bitScanForward(lsBit);
      attackMask |= getKingMovesForSquare(bitboards, player, sq);
      kingBB &= kingBB - one;
    }
  } else {
    // BLACK ATTACK MASK
    let pawnBB = bitboards.blackPawns;
    while (pawnBB) {
      const lsBit = pawnBB & -pawnBB;
      const sq = bitScanForward(lsBit);
      attackMask |= blackPawnMasks[sq];
      pawnBB &= pawnBB - one;
    }

    let knightBB = bitboards.blackKnights;
    while (knightBB) {
      const lsBit = knightBB & -knightBB;
      const sq = bitScanForward(lsBit);
      attackMask |= knightMasks[sq];
      knightBB &= knightBB - one;
    }

    let bishopBB = bitboards.blackBishops;
    while (bishopBB) {
      const lsBit = bishopBB & -bishopBB;
      const sq = bitScanForward(lsBit);
      attackMask |= getBishopMovesForSquare(bitboards, player, sq);
      bishopBB &= bishopBB - one;
    }

    let rookBB = bitboards.blackRooks;
    while (rookBB) {
      const lsBit = rookBB & -rookBB;
      const sq = bitScanForward(lsBit);
      attackMask |= getRookMovesForSquare(bitboards, player, sq);
      rookBB &= rookBB - one;
    }

    let queenBB = bitboards.blackQueens;
    while (queenBB) {
      const lsBit = queenBB & -queenBB;
      const sq = bitScanForward(lsBit);
      attackMask |= getQueenMovesForSquare(bitboards, player, sq);
      queenBB &= queenBB - one;
    }

    let kingBB = bitboards.blackKings;
    while (kingBB) {
      const lsBit = kingBB & -kingBB;
      const sq = bitScanForward(lsBit);
      attackMask |= getKingMovesForSquare(bitboards, player, sq);
      kingBB &= kingBB - one;
    }
  }

  return attackMask;
};

// Map of cached attack masks
const attackMaskCache = new Map();

/**
 * Gets a cached attack mask
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {string} player - whose attack mask it is ("w" or "b")
 * @param {bigint} hash - the hash of the mask to get
 * @returns {bigint} the attack mask
 */
export const getCachedAttackMask = (bitboards, player, hash) => {
  const boardHash = computeHash(bitboards, player);
  if (attackMaskCache.has(boardHash)) {
    console.log(attackMaskCache.size);
    return attackMaskCache.get(boardHash);
  }
  console.log(attackMaskCache.size);
  const mask = computeAttackMask(bitboards, player);
  attackMaskCache.set(boardHash, mask);
  return mask;
};

/**
 * Updates the previous attack mask. Is much more efficient than recomputing it every time.
 *
 * @param {Bitboards} prevBitboards - the previous positions bitboards
 * @param {Bitboards} bitboards - the current positions bitboards
 * @param {number} from - the square moving from
 * @param {number} to - the square moving to
 * @param {bigint} prevHash - the previous hash
 * @returns {bigint} a hash of the new attack map
 */
export const updateAttackMask = (
  prevBitboards,
  bitboards,
  from,
  to,
  prevHash
) => {
  let newHash = prevHash;
  let pieceFrom = getPieceAtSquare(from, prevBitboards);

  // XOR the piece at the previous position
  const zobristFromIndex = pieceToZobristIndex[pieceFrom];
  const zobristFrom = zobristTable[zobristFromIndex][from];
  newHash ^= zobristFrom;

  // XOR the pieces new location
  const pieceTo = getPieceAtSquare(to, bitboards);
  const zobristToIndex = pieceToZobristIndex[pieceTo];
  const zobristTo = zobristTable[zobristToIndex][to];
  newHash ^= zobristTo;

  // if a capture, XOR to remove captured piece
  const prevPieceTo = getPieceAtSquare(to, prevBitboards);
  if (prevPieceTo) {
    const zobristCapturedIndex = pieceToZobristIndex[prevPieceTo];
    const zobristCaptured = zobristTable[zobristCapturedIndex][to];
    newHash ^= zobristCaptured;
  }

  // XOR player
  newHash ^= PLAYER_ZOBRIST;

  return newHash;
};
