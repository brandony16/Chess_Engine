import { bitScanForward, computeHash, getPieceAtSquare, pieceToZobristIndex, PLAYER_ZOBRIST, zobristTable } from "../bbHelpers";
import {
  getBishopMovesForSquare,
  getKingMovesForSquare,
  getQueenMovesForSquare,
  getRookMovesForSquare,
} from "../bbMoveGeneration";
import { knightMasks } from "./knightMask";
import { blackPawnMasks, whitePawnMasks } from "./pawnMask";

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

const attackMaskCache = new Map();

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

export const updateAttackMask = (
  prevBitboards,
  bitboards,
  from,
  to,
  prevHash,
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
