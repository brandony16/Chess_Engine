import { describe, expect, test } from "vitest";
import { Position } from "../../game/Position.ts";
import { START_POS } from "./fens.ts";
import Move from "../../game/moveMaking/move.ts";
import {
  BLACK_KNIGHT,
  BLACK_PAWN,
  sq,
  WHITE_KNIGHT,
  WHITE_PAWN,
} from "../../game/chessConstants.ts";

describe("makeMove - movement", () => {
  test("pawn - single move", () => {
    const pos = new Position();
    pos.loadFen(START_POS);

    const moveW = new Move(sq.A2, sq.A3, WHITE_PAWN);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.D7, sq.D6, BLACK_PAWN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("pawn - double move", () => {
    const pos = new Position();
    pos.loadFen(START_POS);

    const moveW = new Move(sq.E2, sq.E4, WHITE_PAWN);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.H7, sq.H5, BLACK_PAWN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("knight", () => {
    const pos = new Position();
    pos.loadFen(START_POS);

    const moveW = new Move(sq.B1, sq.C3, WHITE_KNIGHT);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.G8, sq.F6, BLACK_KNIGHT);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });
});

// describe("makeMove - captures", () => {});

// describe("makeMove - checks", () => {});

// describe("makeMove - promotion", () => {});
