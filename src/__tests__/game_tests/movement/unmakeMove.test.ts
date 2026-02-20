import { describe, expect, test } from "vitest";
import { Position } from "../../../game/Position.ts";
import { KIWIPETE_POS, START_POS } from "../fens.ts";
import Move from "../../../game/moveMaking/move.ts";
import {
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  NO_PIECE,
  sq,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../../../game/chessConstants.ts";

function mapsEqual<K, V>(a: Map<K, V>, b: Map<K, V>): void {
  expect(a.size).toBe(b.size);

  for (const [key, value] of a) {
    expect(b.has(key)).toBe(true);
    expect(b.get(key)).toBe(value);
  }
}

function areEqual(pos1: Position, pos2: Position): void {
  // Zobrist covers pieces, sideToMove, castling, and en passant
  expect(pos1.zobristKey).toBe(pos2.zobristKey);

  expect(pos1.result).toBe(pos2.result);
  expect(pos1.endState).toBe(pos2.endState);
  expect(pos1.halfmoveClock).toBe(pos2.halfmoveClock);
  expect(pos1.fullmoveNumber).toBe(pos2.fullmoveNumber);

  expect(pos1.moveStack.length).toBe(pos2.moveStack.length);
  expect(pos1.undoStack.length).toBe(pos2.undoStack.length);

  mapsEqual(pos1.pastPositions, pos2.pastPositions);
}

describe("unmakeMove - movement", () => {
  test("pawn - single move", () => {
    const pos = new Position();
    pos.loadFen(START_POS);

    const moveW = new Move(sq.A2, sq.A3, WHITE_PAWN);
    pos.makeMove(moveW);

    const pos2 = pos.copy();

    const moveB = new Move(sq.D7, sq.D6, BLACK_PAWN);
    pos.makeMove(moveB);

    pos.unmakeMove(); // Unmake black move
    areEqual(pos, pos2);

    pos.unmakeMove(); // Unmake white move - back to initial pos
    const pos3 = new Position();
    pos3.loadFen(START_POS);
    areEqual(pos, pos3);
  });

  test("pawn - double move", () => {
    const pos = new Position();
    pos.loadFen(START_POS);

    const moveW = new Move(sq.E2, sq.E4, WHITE_PAWN);
    pos.makeMove(moveW);

    const pos2 = pos.copy();

    const moveB = new Move(sq.H7, sq.H5, BLACK_PAWN);
    pos.makeMove(moveB);

    pos.unmakeMove(); // Unmake black move
    areEqual(pos, pos2);

    pos.unmakeMove(); // Unmake white move - back to initial pos
    const pos3 = new Position();
    pos3.loadFen(START_POS);
    areEqual(pos, pos3);
  });

  test("knight", () => {
    const pos = new Position();
    pos.loadFen(START_POS);

    const moveW = new Move(sq.B1, sq.C3, WHITE_KNIGHT);
    pos.makeMove(moveW);

    const pos2 = pos.copy();

    const moveB = new Move(sq.G8, sq.F6, BLACK_KNIGHT);
    pos.makeMove(moveB);

    pos.unmakeMove(); // Unmake black move
    areEqual(pos, pos2);

    pos.unmakeMove(); // Unmake white move - back to initial pos
    const pos3 = new Position();
    pos3.loadFen(START_POS);
    areEqual(pos, pos3);
  });

  test("bishop", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = new Move(sq.E2, sq.C4, WHITE_BISHOP);
    pos.makeMove(moveW);

    const pos2 = pos.copy();

    const moveB = new Move(sq.G7, sq.H6, BLACK_BISHOP);
    pos.makeMove(moveB);

    pos.unmakeMove(); // Unmake black move
    areEqual(pos, pos2);

    pos.unmakeMove(); // Unmake white move - back to initial pos
    const pos3 = new Position();
    pos3.loadFen(KIWIPETE_POS);
    areEqual(pos, pos3);
  });

  test("rook", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = new Move(sq.A1, sq.C1, WHITE_ROOK);
    pos.makeMove(moveW);

    const pos2 = pos.copy();

    const moveB = new Move(sq.A8, sq.B8, BLACK_ROOK);
    pos.makeMove(moveB);

    pos.unmakeMove(); // Unmake black move
    areEqual(pos, pos2);

    pos.unmakeMove(); // Unmake white move - back to initial pos
    const pos3 = new Position();
    pos3.loadFen(KIWIPETE_POS);
    areEqual(pos, pos3);
  });

  test("queen", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = new Move(sq.F3, sq.G3, WHITE_QUEEN);
    pos.makeMove(moveW);

    const pos2 = pos.copy();

    const moveB = new Move(sq.E7, sq.C5, BLACK_QUEEN);
    pos.makeMove(moveB);

    pos.unmakeMove(); // Unmake black move
    areEqual(pos, pos2);

    pos.unmakeMove(); // Unmake white move - back to initial pos
    const pos3 = new Position();
    pos3.loadFen(KIWIPETE_POS);
    areEqual(pos, pos3);
  });

  test("king - base movement", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = new Move(sq.E1, sq.F1, WHITE_KING);
    pos.makeMove(moveW);

    const pos2 = pos.copy();

    const moveB = new Move(sq.E8, sq.D8, BLACK_KING);
    pos.makeMove(moveB);

    pos.unmakeMove(); // Unmake black move
    areEqual(pos, pos2);

    pos.unmakeMove(); // Unmake white move - back to initial pos
    const pos3 = new Position();
    pos3.loadFen(KIWIPETE_POS);
    areEqual(pos, pos3);
  });

  test("king - castling", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    // White kingside
    const moveW = new Move(sq.E1, sq.G1, WHITE_KING, NO_PIECE, NO_PIECE, true);
    pos.makeMove(moveW);

    const pos2 = pos.copy();

    // Black queenside
    const moveB = new Move(sq.E8, sq.C8, BLACK_KING, NO_PIECE, NO_PIECE, true);
    pos.makeMove(moveB);

    pos.unmakeMove(); // Unmake black move
    areEqual(pos, pos2);

    pos.unmakeMove(); // Unmake white move - back to initial pos
    const pos3 = new Position();
    pos3.loadFen(KIWIPETE_POS);
    areEqual(pos, pos3);
  });
});

// describe("unmakeMove - captures", () => {});

// describe("unmakeMove - promotions", () => {});
