import { describe, expect, test } from "vitest";
import { Position } from "../../../../game/Position.ts";
import { getCheckers } from "../../../../game/moveGen/getCheckers.ts";
import { BLACK, sq, WHITE } from "../../../../game/chessConstants.ts";

describe("single check", () => {
  test("pawn check", () => {
    const pos = new Position();
    pos.loadFen("8/8/2k5/8/8/3p4/4K1P1/8 w - - 0 1");

    const checkers = getCheckers(pos, WHITE);
    const expected = 1n << BigInt(sq.D3);

    expect(checkers).toBe(expected);

    pos.loadFen("8/8/2k5/3P4/6p1/8/4K1P1/8 b - - 0 1");
    expect(getCheckers(pos, BLACK)).toBe(1n << BigInt(sq.D5));
  });

  test("knight check", () => {
    const pos = new Position();
    pos.loadFen("8/8/2k5/8/3n4/8/4K1P1/8 w - - 0 1");

    const checkers = getCheckers(pos, WHITE);
    const expected = 1n << BigInt(sq.D4);

    expect(checkers).toBe(expected);

    pos.loadFen("8/8/2k5/8/3N2p1/8/4K1P1/8 b - - 0 1");
    expect(getCheckers(pos, BLACK)).toBe(1n << BigInt(sq.D4));
  });

  test("bishop check", () => {
    const pos = new Position();
    pos.loadFen("8/8/2k5/1b6/8/8/4K1P1/8 w - - 0 1");

    const checkers = getCheckers(pos, WHITE);
    const expected = 1n << BigInt(sq.B5);

    expect(checkers).toBe(expected);

    pos.loadFen("8/8/2k5/8/B5p1/8/4K1P1/8 b - - 0 1");
    expect(getCheckers(pos, BLACK)).toBe(1n << BigInt(sq.A4));
  });

  test("rook check", () => {
    const pos = new Position();
    pos.loadFen("8/4r3/2k5/8/8/8/4K1P1/8 w - - 0 1");

    const checkers = getCheckers(pos, WHITE);
    const expected = 1n << BigInt(sq.E7);

    expect(checkers).toBe(expected);

    pos.loadFen("8/8/2k3R1/8/6p1/8/4K1P1/8 b - - 0 1");
    expect(getCheckers(pos, BLACK)).toBe(1n << BigInt(sq.G6));
  });

  test("queen check", () => {
    const pos = new Position();
    pos.loadFen("8/8/2k5/8/6q1/8/4K1P1/8 w - - 0 1");

    const checkers = getCheckers(pos, WHITE);
    const expected = 1n << BigInt(sq.G4);

    expect(checkers).toBe(expected);

    pos.loadFen("8/2Q5/2k5/8/6p1/8/4K1P1/8 b - - 0 1");
    expect(getCheckers(pos, BLACK)).toBe(1n << BigInt(sq.C7));
  });
});
