import { describe, expect, it } from "vitest";
import { Position } from "../../../game/Position.ts";
import { KIWIPETE_POS, OPEN_MIDGAME } from "../fens.ts";
import {
  moveCaptured,
  moveFrom,
  movePromotion,
  moveTo,
  type Move,
} from "../../../game/moveMaking/move.ts";

const logMove = (move: Move) => {
  const to = moveTo(move);
  const from = moveFrom(move);
  const captured = moveCaptured(move);
  const promotion = movePromotion(move);

  console.log(
    `From: ${from} To: ${to} Capture: ${captured} Promotion: ${promotion}\n`,
  );
};

describe("correct counts on various middlegame positions", () => {
  it("has the correct count on the KIWIPETE position", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    expect(pos.generateTacticalMoves()).toBe(8);
  });

  it("correctly finds all promotions", () => {
    const pos = new Position();
    // similar to kiwipete, with side to move being black and hxg2 played
    pos.loadFen(
      "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q2/PPPBBPpP/R3K2R b KQkq - 0 1",
    );

    expect(pos.generateTacticalMoves()).toBe(15);
  });

  it("is 0 when there are no tactical moves", () => {
    const pos = new Position();

    expect(pos.generateTacticalMoves()).toBe(0);
  });

  it("is correct on the OPEN_MIDGAME position", () => {
    const pos = new Position();
    pos.loadFen(OPEN_MIDGAME);

    expect(pos.generateTacticalMoves()).toBe(1);
  });
});
