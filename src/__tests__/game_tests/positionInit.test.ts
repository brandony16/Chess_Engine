import { describe, expect, test } from "vitest";
import { Position } from "../../game/Position.ts";
import {
  ALL_CASTLING,
  BK,
  BLACK,
  BQ,
  COLUMN_INDEXES,
  IN_PROGRESS,
  NO_PIECE,
  NO_SQUARE,
  NUM_PIECES,
  PIECES,
  WHITE,
  WK,
  WQ,
} from "../../game/chessConstants.ts";
import { isWhite } from "../../game/pieceUtils/pieceClassifiers.ts";
import {
  EN_PASSANT,
  KIWIPETE_POS,
  KNIGHT_FORK_POS,
  validateBitboards,
} from "./fens.ts";

describe("Position initialization - init values", () => {
  test("arrays are correctly sized", () => {
    const pos = new Position();

    expect(pos.bitboards.length).toBe(NUM_PIECES);
    expect(pos.playerOcc.length).toBe(2);
    expect(pos.pieceAt.length).toBe(64);
    expect(pos.pieceIndexes.length).toBe(NUM_PIECES);
    expect(pos.kingSq.length).toBe(2);
  });

  test("default meta state is correct", () => {
    const pos = new Position();

    expect(pos.sideToMove).toBe(WHITE);
    expect(pos.castlingRights).toBe(ALL_CASTLING);
    expect(pos.enPassantSquare).toBe(NO_SQUARE);
    expect(pos.fullmoveNumber).toBe(1);
    expect(pos.halfmoveClock).toBe(0);
    expect(pos.result).toBe(IN_PROGRESS);
    expect(pos.endState).toBe(IN_PROGRESS);
  });

  test("pieceIndexes arrays are not shared references", () => {
    const pos = new Position();

    const a = pos.pieceIndexes[0];
    const b = pos.pieceIndexes[1];

    expect(a).not.toBe(b);
  });

  test("pieceIndexes are correct", () => {
    const pos = new Position();

    for (const piece of PIECES) {
      const idxArr = pos.pieceIndexes[piece];
      for (const idx of idxArr) {
        const mask = 1n << BigInt(idx);
        expect(pos.bitboards[piece] & mask).toBe(mask);
      }
    }
  });

  test("zobrist key matches recomputed hash", () => {
    const pos = new Position();

    const initZobrist = pos.zobristKey;
    pos.computeZobrist();
    expect(pos.zobristKey).toBe(initZobrist);
  });

  test("position validates after initialization", () => {
    const pos = new Position();
    expect(pos.validate()).toBe(true);
  });
});

describe("Position initialization - board correctness", () => {
  test("occupied equals OR of all piece bitboards", () => {
    const pos = new Position();

    let union = 0n;
    for (let i = 0; i < pos.bitboards.length; i++) {
      union |= pos.bitboards[i];
    }

    expect(pos.occupied).toBe(union);
  });

  test("player occupancy matches piece bitboards", () => {
    const pos = new Position();

    let whiteOcc = 0n;
    let blackOcc = 0n;

    for (const piece of PIECES) {
      if (isWhite(piece)) {
        whiteOcc |= pos.bitboards[piece];
      } else {
        blackOcc |= pos.bitboards[piece];
      }
    }

    expect(pos.playerOcc[WHITE]).toBe(whiteOcc);
    expect(pos.playerOcc[BLACK]).toBe(blackOcc);
  });

  test("initial position has correct piece counts", () => {
    const pos = new Position();

    const totalPieces = pos.pieceAt.filter((p) => p !== NO_PIECE).length;
    expect(totalPieces).toBe(32);
  });
});
