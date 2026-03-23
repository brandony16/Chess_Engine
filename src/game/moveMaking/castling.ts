import { SQUARE_BB_HI, SQUARE_BB_LO } from "../bb.ts";
import {
  B_KINGSIDE_EMPTY,
  B_KINGSIDE_SAFE,
  B_QUEENSIDE_EMPTY,
  B_QUEENSIDE_SAFE,
  BK,
  BLACK_KING,
  BLACK_ROOK,
  BQ,
  C_FILE,
  NO_PIECE,
  sq,
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
import { getFile } from "../helpers/boardUtils.ts";
import type { Position } from "../Position.ts";
import { moveFrom, moveTo, type Move } from "./move.ts";

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
  attackMaskLo: number,
  attackMaskHi: number,
  occLo: number,
  occHi: number,
): boolean {
  const [emptyLo, emptyHi] =
    player === WHITE ? W_KINGSIDE_EMPTY : B_KINGSIDE_EMPTY;
  const [safeLo, safeHi] = player === WHITE ? W_KINGSIDE_SAFE : B_KINGSIDE_SAFE;

  const areOccupied = emptyLo & occLo || emptyHi & occHi;
  const isAttacked = attackMaskLo & safeLo || attackMaskHi & safeHi;
  return !areOccupied && !isAttacked;
}

/**
 * Determines whether a given player can castle queenside
 */
export function isQueensideCastleLegal(
  player: Player,
  attackMaskLo: number,
  attackMaskHi: number,
  occLo: number,
  occHi: number,
): boolean {
  const [emptyLo, emptyHi] =
    player === WHITE ? W_QUEENSIDE_EMPTY : B_QUEENSIDE_EMPTY;
  const [safeLo, safeHi] =
    player === WHITE ? W_QUEENSIDE_SAFE : B_QUEENSIDE_SAFE;

  const areOccupied = emptyLo & occLo || emptyHi & occHi;
  const isAttacked = attackMaskLo & safeLo || attackMaskHi & safeHi;
  return !areOccupied && !isAttacked;
}

export const makeCastleMove = (position: Position, move: Move): void => {
  const bbsHi = position.bbsHi;
  const bbsLo = position.bbsLo;
  const pieceAt = position.pieceAt;

  const from = moveFrom(move);
  const to = moveTo(move);

  const kingPiece = from === sq.E1 ? WHITE_KING : BLACK_KING;
  const rookPiece = from === sq.E1 ? WHITE_ROOK : BLACK_ROOK;

  const fromLo = SQUARE_BB_LO[from];
  const fromHi = SQUARE_BB_HI[from];
  const toLo = SQUARE_BB_LO[to];
  const toHi = SQUARE_BB_HI[to];

  const rookFrom = getFile(to) === C_FILE ? to - 2 : to + 1; // C file is queenside castling
  const rookTo = getFile(to) === C_FILE ? to + 1 : to - 1;
  const rookFromLo = SQUARE_BB_LO[rookFrom];
  const rookFromHi = SQUARE_BB_HI[rookFrom];
  const rookToLo = SQUARE_BB_LO[rookTo];
  const rookToHi = SQUARE_BB_HI[rookTo];

  bbsLo[kingPiece] ^= fromLo;
  bbsHi[kingPiece] ^= fromHi;
  bbsLo[kingPiece] |= toLo;
  bbsHi[kingPiece] |= toHi;

  bbsLo[rookPiece] ^= rookFromLo;
  bbsHi[rookPiece] ^= rookFromHi;
  bbsLo[rookPiece] |= rookToLo;
  bbsHi[rookPiece] |= rookToHi;

  pieceAt[to] = kingPiece;
  pieceAt[from] = NO_PIECE;
  pieceAt[rookTo] = rookPiece;
  pieceAt[rookFrom] = NO_PIECE;
};

export const unMakeCastleMove = (position: Position, move: Move): void => {
  const bbsHi = position.bbsHi;
  const bbsLo = position.bbsLo;
  const pieceAt = position.pieceAt;

  const from = moveFrom(move);
  const to = moveTo(move);

  const kingPiece = from === sq.E1 ? WHITE_KING : BLACK_KING;
  const rookPiece = from === sq.E1 ? WHITE_ROOK : BLACK_ROOK;

  const fromLo = SQUARE_BB_LO[from];
  const fromHi = SQUARE_BB_HI[from];
  const toLo = SQUARE_BB_LO[to];
  const toHi = SQUARE_BB_HI[to];

  const rookFrom = getFile(to) === C_FILE ? to - 2 : to + 1; // C file is queenside castling
  const rookTo = getFile(to) === C_FILE ? from - 1 : from + 1;
  const rookFromLo = SQUARE_BB_LO[rookFrom];
  const rookFromHi = SQUARE_BB_HI[rookFrom];
  const rookToLo = SQUARE_BB_LO[rookTo];
  const rookToHi = SQUARE_BB_HI[rookTo];

  bbsLo[kingPiece] ^= toLo;
  bbsHi[kingPiece] ^= toHi;
  bbsLo[kingPiece] |= fromLo;
  bbsHi[kingPiece] |= fromHi;

  bbsLo[rookPiece] ^= rookToLo;
  bbsHi[rookPiece] ^= rookToHi;
  bbsLo[rookPiece] |= rookFromLo;
  bbsHi[rookPiece] |= rookFromHi;

  pieceAt[to] = NO_PIECE;
  pieceAt[from] = kingPiece;
  pieceAt[rookTo] = NO_PIECE;
  pieceAt[rookFrom] = rookPiece;
};
