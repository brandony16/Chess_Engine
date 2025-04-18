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

import { bitScanForward } from "../bbUtils";
import { blackPawnMasks, whitePawnMasks } from "./pawnMask";
import { knightMasks } from "./knightMask";
import { getBishopMovesForSquare } from "../moveGeneration/minorPieceMoveGeneration";
import {
  getKingMovesForSquare,
  getQueenMovesForSquare,
  getRookMovesForSquare,
} from "../moveGeneration/majorPieceMoveGeneration";
import {
  computeHash,
  pieceToZobristIndex,
  zobristTable,
} from "../zobristHashing";
import { getPieceAtSquare } from "../pieceGetters";
import { LRUMap } from "../LRUMap";
import { PLAYER_ZOBRIST } from "../constants";

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
const attackMaskCache = new LRUMap(500_000);

/**
 * Gets a cached attack mask
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {string} player - whose attack mask it is ("w" or "b")
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
 * @param {Bitboards} prevBitboards - the previous positions bitboards
 * @param {Bitboards} bitboards - the current positions bitboards
 * @param {number} from - the square moving from
 * @param {number} to - the square moving to
 * @param {bigint} prevHash - the previous hash
 * @returns {bigint} a hash of the new attack map
 */
export const updateAttackMaskHash = (
  prevBitboards,
  bitboards,
  from,
  to,
  prevHash,
  player
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

  if (!attackMaskCache.get(newHash)) {
    const newMask = computeAttackMask(bitboards, player);
    attackMaskCache.set(newHash, newMask);
  }

  if (Math.abs(from - to) === 2 && pieceFrom.charAt(5) === "K") {
    newHash = handleCastleHashUpdate(newHash, from, to);
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
    const rookZobristIndex = pieceToZobristIndex["whiteRooks"];
    if (to === 6) {
      // Kingside
      const rookZobristFrom = zobristTable[rookZobristIndex][7];
      const rookZobristTo = zobristTable[rookZobristIndex][5];
      newHash ^= rookZobristFrom;
      newHash ^= rookZobristTo;
      return newHash;
    }
    // Queenside
    const rookZobristFrom = zobristTable[rookZobristIndex][0];
    const rookZobristTo = zobristTable[rookZobristIndex][3];
    newHash ^= rookZobristFrom;
    newHash ^= rookZobristTo;
    return newHash;
  }

  // Black caslting
  const rookZobristIndex = pieceToZobristIndex["blackRooks"];

  if (to === 62) {
    // Kingside
    const rookZobristFrom = zobristTable[rookZobristIndex][63];
    const rookZobristTo = zobristTable[rookZobristIndex][61];
    newHash ^= rookZobristFrom;
    newHash ^= rookZobristTo;
    return newHash;
  }

  // Queenside
  const rookZobristFrom = zobristTable[rookZobristIndex][56];
  const rookZobristTo = zobristTable[rookZobristIndex][59];
  newHash ^= rookZobristFrom;
  newHash ^= rookZobristTo;
  return newHash;
};
