import { BLACK, NO_PIECE, WHITE } from "../chessConstants.ts";
import Move from "../moveMaking/move.ts";
import type { Position } from "../Position.ts";
import { opponent } from "../temp.ts";

export function updateOccupancy(pos: Position, move: Move): void {
  let occ = pos.playerOcc[pos.sideToMove];

  if (move.castling) {
    occ = updateOccCastling(occ, move);
    pos.playerOcc[pos.sideToMove] = occ;
    pos.occupied = pos.playerOcc[WHITE] | pos.playerOcc[BLACK];
    return;
  }

  const maskFrom = 1n << BigInt(move.from);
  const maskTo = 1n << BigInt(move.to);

  occ ^= maskFrom;
  occ |= maskTo;

  pos.playerOcc[pos.sideToMove] = occ;

  if (move.captured !== NO_PIECE) {
    if (move.enPassant) {
      const target = pos.sideToMove === WHITE ? move.to - 8 : move.to + 8;
      pos.playerOcc[opponent(pos.sideToMove)] ^= 1n << BigInt(target);
    } else {
      pos.playerOcc[opponent(pos.sideToMove)] ^= maskTo;
    }
  }

  pos.occupied = pos.playerOcc[WHITE] | pos.playerOcc[BLACK];
}

const updateOccCastling = (oldOcc: bigint, move: Move): bigint => {
  let occ = oldOcc;

  const maskFrom = 1n << BigInt(move.from);
  const maskTo = 1n << BigInt(move.to);

  occ ^= maskFrom;
  occ |= maskTo;

  let rookFrom = 0n;
  let rookTo = 0n;
  if (move.from === 4) {
    if (move.to === 6) {
      rookFrom = 1n << BigInt(7);
      rookTo = 1n << BigInt(5);
    } else {
      rookFrom = 1n << BigInt(0);
      rookFrom = 1n << BigInt(3);
    }
  } else {
    if (move.to === 62) {
      rookFrom = 1n << BigInt(63);
      rookTo = 1n << BigInt(61);
    } else {
      rookFrom = 1n << BigInt(56);
      rookTo = 1n << BigInt(59);
    }
  }

  occ ^= rookFrom;
  occ |= rookTo;

  return occ;
};

export function undoOccupancyUpdate(pos: Position, move: Move): void {
  let occ = pos.playerOcc[pos.sideToMove];

  if (move.castling) {
    occ = undoCastlingOcc(occ, move);
    pos.playerOcc[pos.sideToMove] = occ;
    pos.occupied = pos.playerOcc[WHITE] | pos.playerOcc[BLACK];
    return;
  }

  const maskFrom = 1n << BigInt(move.from);
  const maskTo = 1n << BigInt(move.to);

  occ |= maskFrom;
  occ ^= maskTo;

  pos.playerOcc[pos.sideToMove] = occ;

  if (move.captured !== NO_PIECE) {
    if (move.enPassant) {
      const target = pos.sideToMove === WHITE ? move.to - 8 : move.to + 8;
      pos.playerOcc[opponent(pos.sideToMove)] |= 1n << BigInt(target);
    } else {
      pos.playerOcc[opponent(pos.sideToMove)] |= maskTo;
    }
  }

  pos.occupied = pos.playerOcc[WHITE] | pos.playerOcc[BLACK];
}

const undoCastlingOcc = (oldOcc: bigint, move: Move): bigint => {
  let occ = oldOcc;

  const maskFrom = 1n << BigInt(move.from);
  const maskTo = 1n << BigInt(move.to);

  occ |= maskFrom;
  occ ^= maskTo;

  let rookFrom = 0n;
  let rookTo = 0n;
  if (move.from === 4) {
    if (move.to === 6) {
      rookFrom = 1n << BigInt(7);
      rookTo = 1n << BigInt(5);
    } else {
      rookFrom = 1n << BigInt(0);
      rookFrom = 1n << BigInt(3);
    }
  } else {
    if (move.to === 62) {
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
