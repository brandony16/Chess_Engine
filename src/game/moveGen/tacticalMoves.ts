import type { Position } from "../Position.ts";
import {
  generateAttackEast,
  generateAttackWest,
  generateEpMoves,
  generatePushPromotion,
} from "./pawns.ts";
import {
  BLACK_BISHOP,
  BLACK_KNIGHT,
  BLACK_QUEEN,
  BLACK_ROOK,
  NO_PIECE,
  WHITE,
  WHITE_BISHOP,
  WHITE_KNIGHT,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../chessConstants.ts";
import { lsb } from "../bb.ts";
import { bishopMoves, knightMoves } from "./minorPieces.ts";
import { encodeMove } from "../moveMaking/move.ts";
import { queenMoves, rookMoves } from "./majorPieces.ts";

export const generatePawnTacticals = (pos: Position, start: number): number => {
  const eastCt = generateAttackEast(pos, start);
  start += eastCt;
  const westCt = generateAttackWest(pos, start);
  start += westCt;
  const epCt = generateEpMoves(pos, start);
  start += epCt;
  const pushPromoCt = generatePushPromotion(pos, start);

  return eastCt + westCt + epCt + pushPromoCt;
};

export const generateKnightTacticals = (
  pos: Position,
  start: number,
): number => {
  let count = 0;

  const side = pos.sideToMove;
  const buffer = pos.moveBuffer;
  const pieceAt = pos.pieceAt;
  const opp = pos.sideToMove ^ 1;
  const oppPiecesLo = pos.playerOccLo[opp],
    oppPiecesHi = pos.playerOccHi[opp];

  const knight = side === WHITE ? WHITE_KNIGHT : BLACK_KNIGHT;
  let bbLo = pos.bbsLo[knight],
    bbHi = pos.bbsHi[knight];
  while (bbLo || bbHi) {
    const from = lsb(bbLo, bbHi);
    if (bbLo) bbLo &= bbLo - 1;
    else bbHi &= bbHi - 1;

    let [lo, hi] = knightMoves(pos, from);
    lo &= oppPiecesLo;
    hi &= oppPiecesHi;
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

export const generateBishopTacticals = (
  pos: Position,
  start: number,
): number => {
  let count = 0;

  const side = pos.sideToMove;
  const buffer = pos.moveBuffer;
  const pieceAt = pos.pieceAt;
  const opp = pos.sideToMove ^ 1;
  const oppPiecesLo = pos.playerOccLo[opp],
    oppPiecesHi = pos.playerOccHi[opp];

  const bishop = side === WHITE ? WHITE_BISHOP : BLACK_BISHOP;
  let bbLo = pos.bbsLo[bishop],
    bbHi = pos.bbsHi[bishop];
  while (bbLo || bbHi) {
    const from = lsb(bbLo, bbHi);
    if (bbLo) bbLo &= bbLo - 1;
    else bbHi &= bbHi - 1;

    let [lo, hi] = bishopMoves(pos, from);
    lo &= oppPiecesLo;
    hi &= oppPiecesHi;
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

export const generateRookTacticals = (pos: Position, start: number): number => {
  let count = 0;

  const side = pos.sideToMove;
  const buffer = pos.moveBuffer;
  const pieceAt = pos.pieceAt;
  const opp = pos.sideToMove ^ 1;
  const oppPiecesLo = pos.playerOccLo[opp],
    oppPiecesHi = pos.playerOccHi[opp];

  const rook = side === WHITE ? WHITE_ROOK : BLACK_ROOK;
  let bbLo = pos.bbsLo[rook],
    bbHi = pos.bbsHi[rook];
  while (bbLo || bbHi) {
    const from = lsb(bbLo, bbHi);
    if (bbLo) bbLo &= bbLo - 1;
    else bbHi &= bbHi - 1;

    let [lo, hi] = rookMoves(pos, from);
    lo &= oppPiecesLo;
    hi &= oppPiecesHi;
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

export const generateQueenTacticals = (
  pos: Position,
  start: number,
): number => {
  let count = 0;

  const side = pos.sideToMove;
  const buffer = pos.moveBuffer;
  const pieceAt = pos.pieceAt;
  const opp = pos.sideToMove ^ 1;
  const oppPiecesLo = pos.playerOccLo[opp],
    oppPiecesHi = pos.playerOccHi[opp];

  const queen = side === WHITE ? WHITE_QUEEN : BLACK_QUEEN;
  let bbLo = pos.bbsLo[queen],
    bbHi = pos.bbsHi[queen];
  while (bbLo || bbHi) {
    const from = lsb(bbLo, bbHi);
    if (bbLo) bbLo &= bbLo - 1;
    else bbHi &= bbHi - 1;

    let [lo, hi] = queenMoves(pos, from);
    lo &= oppPiecesLo;
    hi &= oppPiecesHi;
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
