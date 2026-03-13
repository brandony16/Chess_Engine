import { describe, expect, test } from "vitest";
import { Position } from "../../game/Position.ts";
import {
  BLACK_WIN,
  CHECKMATE,
  DRAW,
  FIFTY_MOVE_RULE,
  IN_PROGRESS,
  INSUFFICIENT_MATERIAL,
  REPETITION,
  STALEMATE,
} from "../../game/chessConstants.ts";

describe("checkGameOver", () => {
  test("draw by insufficient material (only kings)", () => {
    const pos = new Position();
    pos.loadFen("8/8/2k5/8/8/5K2/8/8 w - - 0 1"); // just kings

    pos.checkGameOver();
    expect(pos.gameOver()).toBe(true);
    expect(pos.result).toBe(DRAW);
    expect(pos.endState).toBe(INSUFFICIENT_MATERIAL);
  });

  test("draw by fifty-move rule", () => {
    const pos = new Position();
    pos.loadFen("8/8/2k5/2p5/5P2/5K2/8/8 w - - 100 1"); // halfmove clock at 100 -> fifty move rule reached

    pos.checkGameOver();
    expect(pos.gameOver()).toBe(true);
    expect(pos.result).toBe(DRAW);
    expect(pos.endState).toBe(FIFTY_MOVE_RULE);
  });

  test("draw by threefold repetition", () => {
    const pos = new Position();
    pos.loadFen("8/8/2k5/2p5/5P2/5K2/8/8 w - - 0 1");

    // Mkae history have 3 repeated positions
    pos.zobristHistory[0] = pos.zobristKey;
    pos.zobristHistory[2] = pos.zobristKey;
    pos.zobristHistory[4] = pos.zobristKey;

    pos.ply = 4;
    pos.halfmoveClock = 4;

    pos.checkGameOver();
    expect(pos.gameOver()).toBe(true);
    expect(pos.result).toBe(DRAW);
    expect(pos.endState).toBe(REPETITION);
  });

  test("stalemate for side to move", () => {
    const pos = new Position();
    pos.loadFen("8/8/2k5/8/8/8/5q2/7K w - - 0 1"); // king trapped by black queen in corner

    pos.checkGameOver();
    expect(pos.gameOver()).toBe(true);
    expect(pos.result).toBe(DRAW);
    expect(pos.endState).toBe(STALEMATE);
  });

  test("checkmate recognized correctly", () => {
    const pos = new Position();
    pos.loadFen("8/8/8/8/8/4k3/5q2/5K2 w - - 0 1"); // wK checkmates by bQ

    pos.checkGameOver();
    expect(pos.gameOver()).toBe(true);
    expect(pos.result).toBe(BLACK_WIN);
    expect(pos.endState).toBe(CHECKMATE);
  });

  test("game continues when legal moves exist", () => {
    const pos = new Position();

    pos.checkGameOver();
    expect(pos.gameOver()).toBe(false);
    expect(pos.result).toBe(IN_PROGRESS);
    expect(pos.endState).toBe(IN_PROGRESS);
  });
});
