import { describe, expect, test } from "vitest";
import { Position } from "../../../game/Position.ts";
import {
  ALL_CASTLING,
  BLACK,
  IN_PROGRESS,
  NO_PIECE,
  NO_SQUARE,
  NUM_PIECES,
  PIECE_N,
  PIECES,
  WHITE,
} from "../../../game/chessConstants.ts";
import { isWhite } from "../../../game/pieceUtils/pieceClassifiers.ts";

describe("Position initialization - init values", () => {
  test("arrays are correctly sized", () => {
    const pos = new Position();

    expect(pos.bbsLo.length).toBe(PIECE_N);
    expect(pos.bbsHi.length).toBe(PIECE_N);
    expect(pos.playerOccLo.length).toBe(2);
    expect(pos.playerOccHi.length).toBe(2);
    expect(pos.pieceAt.length).toBe(64);
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

    let occLo = 0,
      occHi = 0;
    for (let i = 0; i < pos.bbsLo.length; i++) {
      occLo |= pos.bbsLo[i];
      occHi |= pos.bbsHi[i];
    }

    expect(pos.occupiedLo).toBe(occLo);
    expect(pos.occupiedHi).toBe(occHi);
  });

  test("player occupancy matches piece bitboards", () => {
    const pos = new Position();

    let wOccLo = 0,
      wOccHi = 0;
    let bOccLo = 0,
      bOccHi = 0;

    for (const piece of PIECES) {
      if (isWhite(piece)) {
        wOccLo |= pos.bbsLo[piece];
        wOccHi |= pos.bbsHi[piece];
      } else {
        bOccLo |= pos.bbsLo[piece];
        bOccHi |= pos.bbsHi[piece];
      }
    }

    expect(pos.playerOccLo[WHITE]).toBe(wOccLo);
    expect(pos.playerOccHi[WHITE]).toBe(wOccHi);
    expect(pos.playerOccLo[BLACK]).toBe(bOccLo);
    expect(pos.playerOccHi[BLACK]).toBe(bOccHi);
  });

  test("initial position has correct piece counts", () => {
    const pos = new Position();

    const totalPieces = pos.pieceAt.filter((p) => p !== NO_PIECE).length;
    expect(totalPieces).toBe(32);
  });
});
