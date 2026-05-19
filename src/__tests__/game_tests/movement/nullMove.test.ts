import { describe, expect, test } from "vitest";
import { Position } from "../../../game/Position.ts";
import {
  ACTIVE_KING_ENDGAME,
  ALT_PERFT,
  EN_PASSANT_BLACK,
  EN_PASSANT_WHITE,
  KIWIPETE_POS,
  OPEN_MIDGAME,
  PROMOTION_ENDGAME,
  START_POS,
} from "../fens.ts";
import {
  BLACK,
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  NO_PIECE,
  sq,
  WHITE,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
  type Piece,
} from "../../../game/chessConstants.ts";
import { isRook } from "../../../game/pieceUtils/pieceClassifiers.ts";
import {
  encodeMove,
  FLAG_CASTLE,
  FLAG_EP,
  isCastling,
  moveFrom,
  movePiece,
  movePromotion,
  moveTo,
  type Move,
} from "../../../game/moveMaking/move.ts";

function areEqual(pos1: Position, pos2: Position): void {
  // Zobrist covers pieces, sideToMove, castling, and en passant
  expect(pos1.zobristLo).toBe(pos2.zobristLo);
  expect(pos1.zobristHi).toBe(pos2.zobristHi);

  expect(pos1.result).toBe(pos2.result);
  expect(pos1.endState).toBe(pos2.endState);
  expect(pos1.halfmoveClock).toBe(pos2.halfmoveClock);
  expect(pos1.fullmoveNumber).toBe(pos2.fullmoveNumber);

  expect(pos1.moveStack.length).toBe(pos2.moveStack.length);

  expect(pos1.ply).toBe(pos2.ply);
  expect(pos1.searchPly).toBe(pos2.searchPly);

  for (let i = 0; i < pos1.ply; i++) {
    expect(pos1.zobristHistoryLo[i]).toBe(pos2.zobristHistoryLo[i]);
    expect(pos1.zobristHistoryHi[i]).toBe(pos2.zobristHistoryHi[i]);
    expect(pos1.undoCastling[i]).toBe(pos2.undoCastling[i]);
    expect(pos1.undoEp[i]).toBe(pos2.undoEp[i]);
    expect(pos1.undoHalfmove[i]).toBe(pos2.undoHalfmove[i]);
  }
}

describe("makeNullMove", () => {
  test("start pos", () => {
    const pos = new Position();
    pos.loadFen(START_POS);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);
  });

  test("kiwipete pos", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);
  });

  test("alt perft", () => {
    const pos = new Position();
    pos.loadFen(ALT_PERFT);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);
  });

  test("open midgame", () => {
    const pos = new Position();
    pos.loadFen(OPEN_MIDGAME);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);
  });

  test("promotion endgame", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);
  });
});

describe("unmakeNullMove", () => {
  test("start pos", () => {
    const pos = new Position();
    pos.loadFen(START_POS);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);

    pos.unmakeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    pos.unmakeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);
    areEqual(pos, new Position()); // back to original pos
  });

  test("kiwipete pos", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);

    pos.unmakeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    pos.unmakeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);

    const newPos = new Position();
    newPos.loadFen(KIWIPETE_POS);
    areEqual(pos, newPos); // back to original pos
  });

  test("alt perft", () => {
    const pos = new Position();
    pos.loadFen(ALT_PERFT);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);

    pos.unmakeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    pos.unmakeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);

    const newPos = new Position();
    newPos.loadFen(ALT_PERFT);
    areEqual(pos, newPos); // back to original pos
  });

  test("open midgame", () => {
    const pos = new Position();
    pos.loadFen(OPEN_MIDGAME);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);

    pos.unmakeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    pos.unmakeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);

    const newPos = new Position();
    newPos.loadFen(OPEN_MIDGAME);
    areEqual(pos, newPos); // back to original pos
  });

  test("promotion endgame", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    pos.makeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);

    pos.unmakeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    pos.unmakeNullMove();

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);

    const newPos = new Position();
    newPos.loadFen(PROMOTION_ENDGAME);
    areEqual(pos, newPos); // back to original pos
  });
});
