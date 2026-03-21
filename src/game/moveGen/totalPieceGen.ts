import { lsb } from "../bb.ts";
import {
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  NO_PIECE,
  PROMO_PIECES,
  PROMO_RANK,
  WHITE,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../chessConstants.ts";
import {
  encodeMove,
  FLAG_CASTLE,
  FLAG_DOUBLE,
  FLAG_EP,
} from "../moveMaking/move.ts";
import type { Position } from "../Position.ts";
import { castlingMoves, kingMoves } from "./kingMoves.ts";
import { queenMoves, rookMoves } from "./majorPieces.ts";
import { bishopMoves, knightMoves, pawnMoves } from "./minorPieces.ts";

export const generatePawnMoves = (pos: Position, start: number): number => {
  let count = 0;

  const side = pos.sideToMove;
  const buffer = pos.moveBuffer;
  const pieceAt = pos.pieceAt;
  const promoRank = PROMO_RANK[side];
  const promoList = PROMO_PIECES[side];

  const pawn = side === WHITE ? WHITE_PAWN : BLACK_PAWN;
  let bbLo = pos.bbsLo[pawn];
  let bbHi = pos.bbsHi[pawn];
  while (bbLo || bbHi) {
    const from = lsb(bbLo, bbHi);
    if (bbLo) bbLo &= bbLo - 1;
    else bbHi &= bbHi - 1;

    let [lo, hi] = pawnMoves(pos, from);
    while (lo || hi) {
      const to = lsb(lo, hi);
      if (lo) lo &= lo - 1;
      else hi &= hi - 1;

      let captured = pieceAt[to];

      let flags = 0;

      let delta = from - to;
      if (delta < 0) delta = -delta;

      if (delta === 16) {
        flags |= FLAG_DOUBLE;
      } else if (delta !== 8 && captured === NO_PIECE) {
        flags |= FLAG_EP;
        captured = side === WHITE ? BLACK_PAWN : WHITE_PAWN;
      }

      // Promotion
      if (to >> 3 === promoRank) {
        for (let k = 0; k < promoList.length; k++) {
          buffer[start + count++] = encodeMove(
            from,
            to,
            pawn,
            captured,
            promoList[k],
            flags,
          );
        }

        continue;
      }

      buffer[start + count++] = encodeMove(
        from,
        to,
        pawn,
        captured,
        NO_PIECE,
        flags,
      );
    }
  }

  return count;
};

export const generateKnightMoves = (pos: Position, start: number): number => {
  let count = 0;

  const side = pos.sideToMove;
  const buffer = pos.moveBuffer;
  const pieceAt = pos.pieceAt;

  const knight = side === WHITE ? WHITE_KNIGHT : BLACK_KNIGHT;
  let bbLo = pos.bbsLo[knight],
    bbHi = pos.bbsHi[knight];
  while (bbLo || bbHi) {
    const from = lsb(bbLo, bbHi);
    if (bbLo) bbLo &= bbLo - 1;
    else bbHi &= bbHi - 1;

    let [lo, hi] = knightMoves(pos, from);
    while (lo || hi) {
      const to = lsb(lo, hi);
      if (lo) lo &= lo - 1;
      else hi &= hi - 1;

      const captured = pieceAt[to];

      buffer[start + count++] = encodeMove(
        from,
        to,
        knight,
        captured,
        NO_PIECE,
        0, // no flags
      );
    }
  }

  return count;
};

export const generateBishopMoves = (pos: Position, start: number): number => {
  let count = 0;

  const side = pos.sideToMove;
  const buffer = pos.moveBuffer;
  const pieceAt = pos.pieceAt;

  const bishop = side === WHITE ? WHITE_BISHOP : BLACK_BISHOP;
  let bbLo = pos.bbsLo[bishop],
    bbHi = pos.bbsHi[bishop];
  while (bbLo || bbHi) {
    const from = lsb(bbLo, bbHi);
    if (bbLo) bbLo &= bbLo - 1;
    else bbHi &= bbHi - 1;

    let [lo, hi] = bishopMoves(pos, from);
    while (lo || hi) {
      const to = lsb(lo, hi);
      if (lo) lo &= lo - 1;
      else hi &= hi - 1;

      const captured = pieceAt[to];

      buffer[start + count++] = encodeMove(
        from,
        to,
        bishop,
        captured,
        NO_PIECE,
        0, // no flags
      );
    }
  }

  return count;
};

export const generateRookMoves = (pos: Position, start: number): number => {
  let count = 0;

  const side = pos.sideToMove;
  const buffer = pos.moveBuffer;
  const pieceAt = pos.pieceAt;

  const rook = side === WHITE ? WHITE_ROOK : BLACK_ROOK;
  let bbLo = pos.bbsLo[rook],
    bbHi = pos.bbsHi[rook];
  while (bbLo || bbHi) {
    const from = lsb(bbLo, bbHi);
    if (bbLo) bbLo &= bbLo - 1;
    else bbHi &= bbHi - 1;

    let [lo, hi] = rookMoves(pos, from);
    while (lo || hi) {
      const to = lsb(lo, hi);
      if (lo) lo &= lo - 1;
      else hi &= hi - 1;

      const captured = pieceAt[to];

      buffer[start + count++] = encodeMove(
        from,
        to,
        rook,
        captured,
        NO_PIECE,
        0, // no flags
      );
    }
  }

  return count;
};

export const generateQueenMoves = (pos: Position, start: number): number => {
  let count = 0;

  const side = pos.sideToMove;
  const buffer = pos.moveBuffer;
  const pieceAt = pos.pieceAt;

  const queen = side === WHITE ? WHITE_QUEEN : BLACK_QUEEN;
  let bbLo = pos.bbsLo[queen],
    bbHi = pos.bbsHi[queen];
  while (bbLo || bbHi) {
    const from = lsb(bbLo, bbHi);
    if (bbLo) bbLo &= bbLo - 1;
    else bbHi &= bbHi - 1;

    let [lo, hi] = queenMoves(pos, from);
    while (lo || hi) {
      const to = lsb(lo, hi);
      if (lo) lo &= lo - 1;
      else hi &= hi - 1;

      const captured = pieceAt[to];

      buffer[start + count++] = encodeMove(
        from,
        to,
        queen,
        captured,
        NO_PIECE,
        0, // no flags
      );
    }
  }

  return count;
};

export const generateKingMoves = (pos: Position, start: number): number => {
  let count = 0;

  const side = pos.sideToMove;
  const buffer = pos.moveBuffer;
  const pieceAt = pos.pieceAt;

  const king = side === WHITE ? WHITE_KING : BLACK_KING;
  const from = pos.kingSq[side];
  let [lo, hi] = kingMoves(pos, from);
  while (lo || hi) {
    const to = lsb(lo, hi);
    if (lo) lo &= lo - 1;
    else hi &= hi - 1;

    const captured = pieceAt[to];

    buffer[start + count++] = encodeMove(
      from,
      to,
      king,
      captured,
      NO_PIECE,
      0, // no flags
    );
  }
  if (!pos.castlingRights) return count;

  [lo, hi] = castlingMoves(pos, from);
  while (lo || hi) {
    const to = lsb(lo, hi);
    if (lo) lo &= lo - 1;
    else hi &= hi - 1;

    const captured = pieceAt[to];

    buffer[start + count++] = encodeMove(
      from,
      to,
      king,
      captured,
      NO_PIECE,
      FLAG_CASTLE,
    );
  }

  return count;
};
