import { bitScanForward } from "../bbUtils";
import { blackPawnMasks, whitePawnMasks } from "./pawnMask";
import { knightMasks } from "./knightMask";
import { computeHash, zobristTable } from "../zobristHashing";
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
  WHITE,
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
import {
  computeMaskForPiece,
  individualAttackMasks,
} from "./individualAttackMasks";
import { bigIntFullRep } from "../generalHelpers";

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

export const updateAttackMask = (bitboards, piece, captured, player) => {
  // Remove old attacks of the piece
  individualAttackMasks[piece] = computeMaskForPiece(bitboards, piece);

  if (captured !== null) {
    individualAttackMasks[captured] = computeMaskForPiece(bitboards, captured);
  }

  // Recompute sliding pieces to account for blockers
  individualAttackMasks[WHITE_BISHOP] = computeMaskForPiece(
    bitboards,
    WHITE_BISHOP
  );
  individualAttackMasks[WHITE_ROOK] = computeMaskForPiece(
    bitboards,
    WHITE_ROOK
  );
  individualAttackMasks[WHITE_QUEEN] = computeMaskForPiece(
    bitboards,
    WHITE_QUEEN
  );
  individualAttackMasks[BLACK_BISHOP] = computeMaskForPiece(
    bitboards,
    BLACK_BISHOP
  );
  individualAttackMasks[BLACK_ROOK] = computeMaskForPiece(
    bitboards,
    BLACK_ROOK
  );
  individualAttackMasks[BLACK_QUEEN] = computeMaskForPiece(
    bitboards,
    BLACK_QUEEN
  );

  let mask = 0n;
  if (player === WHITE) {
    for (let p = 0; p < 6; p++) {
      mask |= individualAttackMasks[p];
    }
  } else {
    for (let p = 6; p <= 11; p++) {
      mask |= individualAttackMasks[p];
    }
  }

  return mask;
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
 * @param {BigUint64Array} bitboards - the current positions bitboards
 * @param {bigint} prevHash - the previous hash
 * @param {Move} move - the move object
 * @param {number} player - the player to compute the attack mask for (0 for w, 1 for b)
 * @param {number} enPassantSquare - the square where en passant is legal
 * @returns {bigint} a hash of the new attack map
 */
export const updateAttackMaskHash = (
  bitboards,
  prevHash,
  move,
  player,
  enPassantSquare,
  isSamePlayer = false
) => {
  let newHash = prevHash;
  const from = move.from;
  const to = move.to;
  const piece = move.piece;
  const captured = move.captured;

  // XOR the piece at the previous position
  const zobristFrom = zobristTable[piece * 64 + from];
  newHash ^= zobristFrom;

  // XOR the pieces new location
  const pieceTo = move.promotion ? move.promotion : piece;
  const zobristTo = zobristTable[pieceTo * 64 + to];
  newHash ^= zobristTo;

  // if a capture, XOR to remove captured piece
  if (
    to === enPassantSquare &&
    (piece === WHITE_PAWN || piece === BLACK_PAWN)
  ) {
    // white EP: captured pawn is one rank down; black EP: one rank up
    const capSq = player ? to + 8 : to - 8;
    newHash ^= zobristTable[captured * 64 + capSq];
  } else if (captured !== null) {
    newHash ^= zobristTable[captured * 64 + to];
  }

  // XOR player
  if (!isSamePlayer) {
    newHash ^= PLAYER_ZOBRIST;
  }

  if (move.castling) {
    newHash = handleCastleHashUpdate(newHash, from, to);
  }

  if (!attackMaskCache.has(newHash)) {
    const newMask = updateAttackMask(bitboards, piece, captured, player);
    if (from === 31 && to === 23 && ((bitboards[3] & 1n << 1n) !== 0n)) {
      console.log(move, player)
      console.log(bigIntFullRep(newMask));
    }
    attackMaskCache.set(newHash, newMask);
  }

  return newHash;
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

/**
 * Clears the attak mask cache
 */
export const clearAttackMaskCache = () => {
  attackMaskCache.clear();
};
