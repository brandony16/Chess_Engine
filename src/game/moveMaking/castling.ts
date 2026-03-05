import {
  B_KINGSIDE_EMPTY,
  B_KINGSIDE_SAFE,
  B_QUEENSIDE_EMPTY,
  B_QUEENSIDE_SAFE,
  BK,
  BLACK_KING,
  BLACK_ROOK,
  BQ,
  NO_PIECE,
  W_KINGSIDE_EMPTY,
  W_KINGSIDE_SAFE,
  W_QUEENSIDE_EMPTY,
  W_QUEENSIDE_SAFE,
  WHITE,
  WHITE_KING,
  WHITE_ROOK,
  WK,
  WQ,
  type CastlingNumber,
  type Player,
  type Square,
} from "../chessConstants.ts";
import type { Position } from "../Position.ts";
import type Move from "./move.ts";

export const updateCastlingRights = (
  from: Square,
  to: Square,
  prevRights: CastlingNumber,
): CastlingNumber => {
  let rights = prevRights;

  // White king moved
  if (from === 4) {
    rights &= ~(WK | WQ);
  }

  // Black king moved
  if (from === 60) {
    rights &= ~(BK | BQ);
  }

  // White rooks moved or captured
  if (from === 0 || to === 0) rights &= ~WQ; // a1 rook
  if (from === 7 || to === 7) rights &= ~WK; // h1 rook

  // Black rooks moved or captured
  if (from === 56 || to === 56) rights &= ~BQ; // a8 rook
  if (from === 63 || to === 63) rights &= ~BK; // h8 rook

  return rights as CastlingNumber;
};

/**
 * Determines whether a given player can castle kingside
 */
export function isKingsideCastleLegal(
  player: Player,
  attackMask: bigint,
  occ: bigint,
): boolean {
  const EMPTY = player === WHITE ? W_KINGSIDE_EMPTY : B_KINGSIDE_EMPTY;
  const SAFE = player === WHITE ? W_KINGSIDE_SAFE : B_KINGSIDE_SAFE;

  return ((occ & EMPTY) | (attackMask & SAFE)) === 0n;
}

/**
 * Determines whether a given player can castle queenside
 */
export function isQueensideCastleLegal(
  player: Player,
  attackMask: bigint,
  occ: bigint,
): boolean {
  const EMPTY = player === WHITE ? W_QUEENSIDE_EMPTY : B_QUEENSIDE_EMPTY;
  const SAFE = player === WHITE ? W_QUEENSIDE_SAFE : B_QUEENSIDE_SAFE;

  return ((occ & EMPTY) | (attackMask & SAFE)) === 0n;
}

export const makeCastleMove = (position: Position, move: Move): void => {
  const bitboards = position.bitboards;
  const pieceAt = position.pieceAt;

  const from = move.from;
  const to = move.to;

  if (from === 4 && to === 6) {
    // White kingside castling
    bitboards[WHITE_KING] ^= 1n << 4n;
    bitboards[WHITE_KING] |= 1n << 6n;
    bitboards[WHITE_ROOK] ^= 1n << 7n;
    bitboards[WHITE_ROOK] |= 1n << 5n;
    pieceAt[to] = WHITE_KING;
    pieceAt[from] = NO_PIECE;
    pieceAt[7] = NO_PIECE;
    pieceAt[5] = WHITE_ROOK;
  } else if (from === 4 && to === 2) {
    // White queenside castling
    bitboards[WHITE_KING] ^= 1n << 4n;
    bitboards[WHITE_KING] |= 1n << 2n;
    bitboards[WHITE_ROOK] ^= 1n << 0n;
    bitboards[WHITE_ROOK] |= 1n << 3n;
    pieceAt[to] = WHITE_KING;
    pieceAt[from] = NO_PIECE;
    pieceAt[0] = NO_PIECE;
    pieceAt[3] = WHITE_ROOK;
  } else if (from === 60 && to === 62) {
    // Black kingside castling
    bitboards[BLACK_KING] ^= 1n << 60n;
    bitboards[BLACK_KING] |= 1n << 62n;
    bitboards[BLACK_ROOK] ^= 1n << 63n;
    bitboards[BLACK_ROOK] |= 1n << 61n;
    pieceAt[to] = BLACK_KING;
    pieceAt[from] = NO_PIECE;
    pieceAt[63] = NO_PIECE;
    pieceAt[61] = BLACK_ROOK;
  } else if (from === 60 && to === 58) {
    // Black queenside castling
    bitboards[BLACK_KING] ^= 1n << 60n;
    bitboards[BLACK_KING] |= 1n << 58n;
    bitboards[BLACK_ROOK] ^= 1n << 56n;
    bitboards[BLACK_ROOK] |= 1n << 59n;
    pieceAt[to] = BLACK_KING;
    pieceAt[from] = NO_PIECE;
    pieceAt[56] = NO_PIECE;
    pieceAt[59] = BLACK_ROOK;
  }
};

export const unMakeCastleMove = (position: Position, move: Move): void => {
  const bitboards = position.bitboards;
  const pieceAt = position.pieceAt;

  const from = move.from;
  const to = move.to;

  if (from === 4 && to === 6) {
    // White kingside castling
    bitboards[WHITE_KING] &= ~(1n << 6n);
    bitboards[WHITE_KING] |= 1n << 4n;
    bitboards[WHITE_ROOK] &= ~(1n << 5n);
    bitboards[WHITE_ROOK] |= 1n << 7n;
    pieceAt[from] = WHITE_KING;
    pieceAt[to] = NO_PIECE;
    pieceAt[5] = NO_PIECE;
    pieceAt[7] = WHITE_ROOK;
  } else if (from === 4 && to === 2) {
    // White queenside castling
    bitboards[WHITE_KING] &= ~(1n << 2n);
    bitboards[WHITE_KING] |= 1n << 4n;
    bitboards[WHITE_ROOK] &= ~(1n << 3n);
    bitboards[WHITE_ROOK] |= 1n << 0n;
    pieceAt[from] = WHITE_KING;
    pieceAt[to] = NO_PIECE;
    pieceAt[3] = NO_PIECE;
    pieceAt[0] = WHITE_ROOK;
  } else if (from === 60 && to === 62) {
    // Black kingside castling
    bitboards[BLACK_KING] &= ~(1n << 62n);
    bitboards[BLACK_KING] |= 1n << 60n;
    bitboards[BLACK_ROOK] &= ~(1n << 61n);
    bitboards[BLACK_ROOK] |= 1n << 63n;
    pieceAt[from] = BLACK_KING;
    pieceAt[to] = NO_PIECE;
    pieceAt[61] = NO_PIECE;
    pieceAt[63] = BLACK_ROOK;
  } else if (from === 60 && to === 58) {
    // Black queenside castling
    bitboards[BLACK_KING] &= ~(1n << 58n);
    bitboards[BLACK_KING] |= 1n << 60n;
    bitboards[BLACK_ROOK] &= ~(1n << 59n);
    bitboards[BLACK_ROOK] |= 1n << 56n;
    pieceAt[from] = BLACK_KING;
    pieceAt[to] = NO_PIECE;
    pieceAt[59] = NO_PIECE;
    pieceAt[56] = BLACK_ROOK;
  }
};
