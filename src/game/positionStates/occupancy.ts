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

const updateOccCastling = (
  occLo: number,
  occHi: number,
  move: Move,
): Bitboard => {
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
  const side = pos.sideToMove;
  let occLo = pos.playerOccLo[side];
  let occHi = pos.playerOccHi[side];

  if (isCastling(move)) {
    [occLo, occHi] = undoCastlingOcc(occLo, occHi, move);
    pos.playerOccLo[side] = occLo;
    pos.playerOccHi[side] = occHi;
    pos.occupiedLo = pos.playerOccLo[WHITE] | pos.playerOccLo[BLACK];
    pos.occupiedHi = pos.playerOccHi[WHITE] | pos.playerOccHi[BLACK];
    return;
  }

  const [fromLo, fromHi] = squareBB(from);
  const [toLo, toHi] = squareBB(to);

  occLo ^= toLo;
  occHi ^= toHi;

  occLo |= fromLo;
  occHi |= fromHi;

  pos.playerOccLo[side] = occLo;
  pos.playerOccHi[side] = occHi;

  if (moveCaptured(move) !== NO_PIECE) {
    const opp = opponent(side);
    if (isEnPassant(move)) {
      const target = side === WHITE ? to - 8 : to + 8;
      const [targetLo, targetHi] = squareBB(target);
      pos.playerOccLo[opp] |= targetLo;
      pos.playerOccHi[opp] |= targetHi;
    } else {
      pos.playerOccLo[opp] |= toLo;
      pos.playerOccHi[opp] |= toHi;
    }
  }

  pos.occupiedLo = pos.playerOccLo[WHITE] | pos.playerOccLo[BLACK];
  pos.occupiedHi = pos.playerOccHi[WHITE] | pos.playerOccHi[BLACK];
}

const undoCastlingOcc = (
  occLo: number,
  occHi: number,
  move: Move,
): Bitboard => {
  const from = moveFrom(move);
  const to = moveTo(move);

  const [fromLo, fromHi] = squareBB(from);
  const [toLo, toHi] = squareBB(to);

  occLo ^= toLo;
  occHi ^= toHi;

  occLo |= fromLo;
  occHi |= fromHi;

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

  occLo |= rFromLo;
  occHi |= rFromHi;
  occLo ^= rToLo;
  occHi ^= rToHi;

  return [occLo, occHi];
};
