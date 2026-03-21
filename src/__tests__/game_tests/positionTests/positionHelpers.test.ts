import { describe, expect, test } from "vitest";
import { Position } from "../../../game/Position.ts";
import { KIWIPETE_POS } from "../fens.ts";
import { playerAttackMask } from "../../../game/attackMasks/attackMasks.ts";
import { BLACK, sq, WHITE } from "../../../game/chessConstants.ts";
import { testBit } from "../../../game/bb.ts";

describe("isSquareAttacked", () => {
  test("works for white", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const [lo, hi] = playerAttackMask(pos, WHITE);
    for (const i of Object.values(sq)) {
      // Not attacked
      if (!testBit(lo, hi, i)) {
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

    const [lo, hi] = playerAttackMask(pos, BLACK);
    for (const i of Object.values(sq)) {
      // Not attacked
      if (!testBit(lo, hi, i)) {
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

    const occLo = pos.playerOccLo[WHITE];
    const occHi = pos.playerOccHi[WHITE];
    for (const i of Object.values(sq)) {
      // players piece not at i
      if (!testBit(occLo, occHi, i)) {
        expect(pos.isPlayersPieceAt(i, WHITE)).toBe(false);
      } else {
        // piece is at i
        expect(pos.isPlayersPieceAt(i, WHITE)).toBe(true);
      }
    }
  });

  test("works for black", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const occLo = pos.playerOccLo[BLACK];
    const occHi = pos.playerOccHi[BLACK];
    for (const i of Object.values(sq)) {
      // players piece not at i
      if (!testBit(occLo, occHi, i)) {
        expect(pos.isPlayersPieceAt(i, BLACK)).toBe(false);
      } else {
        // piece is at i
        expect(pos.isPlayersPieceAt(i, BLACK)).toBe(true);
      }
    }
  });
});
