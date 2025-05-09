import { bitScanForward } from "../bbUtils";
import {
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  NUM_PIECES,
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
import { knightMasks } from "./knightMask";
import { blackPawnMasks, whitePawnMasks } from "./pawnMask";

export const attacksOf = (bitboards, piece, square) => {
  switch (piece) {
    case WHITE_PAWN:
      return whitePawnMasks[square];
    case BLACK_PAWN:
      return blackPawnMasks[square];
    case WHITE_KNIGHT:
    case BLACK_KNIGHT:
      return knightMasks[square];
    case WHITE_KING.wK:
    case BLACK_KING.bK:
      return kingMasks[square];
    case WHITE_BISHOP:
    case BLACK_BISHOP: {
      return getBishopAttacksForSquare(bitboards, square);
    }
    case WHITE_ROOK:
    case BLACK_ROOK: {
      return getRookAttacksForSquare(bitboards, square);
    }
    case WHITE_QUEEN:
    case BLACK_QUEEN: {
      return getQueenAttacksForSquare(bitboards, square);
    }
    default:
      return 0n;
  }
};

export const computeMaskForPiece = (bitboards, piece) => {
  let mask = 0n;
  let bitboard = bitboards[piece];

  while (bitboard) {
    const sq = bitScanForward(bitboard);
    mask |= attacksOf(bitboards, piece, sq);
    bitboard &= bitboard - 1n;
  }

  return mask;
};

export const computeAllAttackMasks = (bitboards) => {
  for (let p = 0; p < NUM_PIECES; p++) {
    individualAttackMasks[p] = computeMaskForPiece(bitboards, p);
  }

  return individualAttackMasks;
};

export const individualAttackMasks = new BigUint64Array(NUM_PIECES).fill(0n);
