import { BLACK, NO_PIECE, WHITE } from "../chessConstants.ts";
import type { Position } from "../Position.ts";
import { opponent } from "../helpers/opponent.ts";
import {
  isCastling,
  isEnPassant,
  moveCaptured,
  moveFrom,
  moveTo,
  type Move,
} from "../moveMaking/move.ts";
import { squareBB, type Bitboard } from "../bb.ts";

export function updateOccupancy(pos: Position, move: Move): void {
  const from = moveFrom(move);
  const to = moveTo(move);
  const side = pos.sideToMove;

  let occLo = pos.playerOccLo[side],
    occHi = pos.playerOccHi[side];

  if (isCastling(move)) {
    [occLo, occHi] = updateOccCastling(occLo, occHi, move);
    pos.playerOccLo[side] = occLo;
    pos.playerOccHi[side] = occHi;

    pos.occupiedLo = pos.playerOccLo[WHITE] | pos.playerOccLo[BLACK];
    pos.occupiedHi = pos.playerOccHi[WHITE] | pos.playerOccHi[BLACK];
    return;
  }

  const [fromLo, fromHi] = squareBB(from);
  const [toLo, toHi] = squareBB(to);

  occLo ^= fromLo;
  occHi ^= fromHi;

  occLo |= toLo;
  occHi |= toHi;

  pos.playerOccLo[side] = occLo;
  pos.playerOccHi[side] = occHi;

  if (moveCaptured(move) !== NO_PIECE) {
    const opp = opponent(side);
    if (isEnPassant(move)) {
      const target = pos.sideToMove === WHITE ? to - 8 : to + 8;
      const [targetLo, targetHi] = squareBB(target);
      pos.playerOccLo[opp] ^= targetLo;
      pos.playerOccHi[opp] ^= targetHi;
    } else {
      pos.playerOccLo[opp] ^= toLo;
      pos.playerOccHi[opp] ^= toHi;
    }
  }

  pos.occupiedLo = pos.playerOccLo[WHITE] | pos.playerOccLo[BLACK];
  pos.occupiedHi = pos.playerOccHi[WHITE] | pos.playerOccHi[BLACK];
}

const updateOccCastling = (occLo: number, occHi: number, move: Move): Bitboard => {
  const from = moveFrom(move);
  const to = moveTo(move);

  const [fromLo, fromHi] = squareBB(from);
  const [toLo, toHi] = squareBB(to);

  occLo ^= fromLo;
  occHi ^= fromHi;

  occLo |= toLo;
  occHi |= toHi;

  let rookFrom, rookTo;
  if (from === 4) {
    if (to === 6) {
      rookFrom = 7;
      rookTo = 5;
    } else {
      rookFrom = 0;
      rookTo = 3;
    }
  } else {
    if (to === 62) {
      rookFrom = 63;
      rookTo = 61;
    } else {
      rookFrom = 56;
      rookTo = 59;
    }
  }

  const [rFromLo, rFromHi] = squareBB(rookFrom);
  const [rToLo, rToHi] = squareBB(rookTo);

  occLo ^= rFromLo;
  occHi ^= rFromHi;
  occLo |= rToLo;
  occHi |= rToHi;

  return [occLo, occHi];
};

export function undoOccupancyUpdate(pos: Position, move: Move): void {
  const from = moveFrom(move);
  const to = moveTo(move);
  let occ = pos.playerOcc[pos.sideToMove];

  if (isCastling(move)) {
    occ = undoCastlingOcc(occ, move);
    pos.playerOcc[pos.sideToMove] = occ;
    pos.occupied = pos.playerOcc[WHITE] | pos.playerOcc[BLACK];
    return;
  }

  const maskFrom = 1n << BigInt(from);
  const maskTo = 1n << BigInt(to);

  occ |= maskFrom;
  occ ^= maskTo;

  pos.playerOcc[pos.sideToMove] = occ;

  if (moveCaptured(move) !== NO_PIECE) {
    if (isEnPassant(move)) {
      const target = pos.sideToMove === WHITE ? to - 8 : to + 8;
      pos.playerOcc[opponent(pos.sideToMove)] |= 1n << BigInt(target);
    } else {
      pos.playerOcc[opponent(pos.sideToMove)] |= maskTo;
    }
  }

  pos.occupied = pos.playerOcc[WHITE] | pos.playerOcc[BLACK];
}

const undoCastlingOcc = (oldOcc: bigint, move: Move): bigint => {
  const from = moveFrom(move);
  const to = moveTo(move);
  let occ = oldOcc;

  const maskFrom = 1n << BigInt(from);
  const maskTo = 1n << BigInt(to);

  occ |= maskFrom;
  occ ^= maskTo;

  let rookFrom = 0n;
  let rookTo = 0n;
  if (from === 4) {
    if (to === 6) {
      rookFrom = 1n << BigInt(7);
      rookTo = 1n << BigInt(5);
    } else {
      rookFrom = 1n << BigInt(0);
      rookFrom = 1n << BigInt(3);
    }
  } else {
    if (to === 62) {
      rookFrom = 1n << BigInt(63);
      rookTo = 1n << BigInt(61);
    } else {
      rookFrom = 1n << BigInt(56);
      rookTo = 1n << BigInt(59);
    }
  }

  occ |= rookFrom;
  occ ^= rookTo;

  return occ;
};
