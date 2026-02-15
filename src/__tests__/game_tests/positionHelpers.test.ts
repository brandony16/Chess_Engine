import { describe, expect, test } from "vitest";
import { Position } from "../../game/Position.ts";
import { KIWIPETE_POS } from "./fens.ts";
import { playerAttackMask } from "../../game/attackMasks/attackMasks.ts";
import { BLACK, WHITE } from "../../game/chessConstants.ts";

describe("isSquareAttacked", () => {
  test("works for white", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const attackMask = playerAttackMask(pos, WHITE);
    for (let i = 0; i < 64; i++) {
      const mask = 1n << BigInt(i);

      // Not attacked
      if ((attackMask & mask) === 0n) {
        expect(pos.isSquareAttacked(i, WHITE)).toBe(false);
      } else {
        // Attacked
        expect(pos.isSquareAttacked(i, WHITE)).toBe(true);
      }
    }
  });

  test("works for black", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const attackMask = playerAttackMask(pos, BLACK);
    for (let i = 0; i < 64; i++) {
      const mask = 1n << BigInt(i);

      // Not attacked
      if ((attackMask & mask) === 0n) {
        expect(pos.isSquareAttacked(i, BLACK)).toBe(false);
      } else {
        // Attacked
        expect(pos.isSquareAttacked(i, BLACK)).toBe(true);
      }
    }
  });
});

describe("isPlayersPieceAt", () => {
  test("works for white", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const occ = pos.playerOcc[WHITE];
    for (let i = 0; i < 64; i++) {
      const mask = 1n << BigInt(i);

      // Not attacked
      if ((occ & mask) === 0n) {
        expect(pos.isPlayersPieceAt(i, WHITE)).toBe(false);
      } else {
        // Attacked
        expect(pos.isPlayersPieceAt(i, WHITE)).toBe(true);
      }
    }
  });

  test("works for black", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const attackMask = playerAttackMask(pos, BLACK);
    for (let i = 0; i < 64; i++) {
      const mask = 1n << BigInt(i);

      // Not attacked
      if ((attackMask & mask) === 0n) {
        expect(pos.isSquareAttacked(i, BLACK)).toBe(false);
      } else {
        // Attacked
        expect(pos.isSquareAttacked(i, BLACK)).toBe(true);
      }
    }
  });
});
