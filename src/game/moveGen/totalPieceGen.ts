import { lsb } from "../bb.ts";
import {
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_QUEEN,
  BLACK_ROOK,
  NO_PIECE,
  WHITE,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../chessConstants.ts";
import {
  encodeMove,
  FLAG_CASTLE,
} from "../moveMaking/move.ts";
import type { Position } from "../Position.ts";
import { castlingMoves, kingMoves } from "./kingMoves.ts";
import { queenMoves, rookMoves } from "./majorPieces.ts";
import { bishopMoves, knightMoves } from "./minorPieces.ts";
import {
  generateAttackEast,
  generateAttackWest,
  generateDoublePush,
  generateEpMoves,
  generateSinglePush,
} from "./pawns.ts";

export const generatePawnMoves = (pos: Position, start: number): number => {
  const singleCt = generateSinglePush(pos, start);
  start += singleCt;
  const doubleCt = generateDoublePush(pos, start);
  start += doubleCt;
  const eastCt = generateAttackEast(pos, start);
  start += eastCt;
  const westCt = generateAttackWest(pos, start);
  start += westCt;
  const epCt = generateEpMoves(pos, start);

  return singleCt + doubleCt + eastCt + westCt + epCt;
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
