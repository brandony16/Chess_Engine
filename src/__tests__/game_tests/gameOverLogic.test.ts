import { describe, expect, test } from "vitest";
import { Position } from "../../game/Position.ts";
import {
  BLACK_QUEEN,
  BLACK_WIN,
  CHECKMATE,
  DRAW,
  FIFTY_MOVE_RULE,
  IN_PROGRESS,
  INSUFFICIENT_MATERIAL,
  REPETITION,
  sq,
  STALEMATE,
  WHITE_KING,
  WHITE_PAWN,
  WHITE_QUEEN,
} from "../../game/chessConstants.ts";
import Move from "../../game/moveMaking/move.ts";

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

    // Hacky way to set curr pos to have occured 3 times
    pos.pastPositions.set(pos.zobristKey, 3);

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

describe("playMove gameOver", () => {
  test("draw by insufficient material (only kings)", () => {
    const pos = new Position();
    pos.loadFen("8/8/2k5/8/8/5Kq1/8/8 w - - 0 1"); // wK about to capture bQ

    const move = new Move(sq.F3, sq.G3, WHITE_KING, BLACK_QUEEN);
    pos.playMove(move);

    expect(pos.gameOver()).toBe(true);
    expect(pos.result).toBe(DRAW);
    expect(pos.endState).toBe(INSUFFICIENT_MATERIAL);
  });

  test("draw by fifty-move rule", () => {
    const pos = new Position();
    pos.loadFen("8/8/2k5/2p5/5P2/5K2/8/8 w - - 99 1"); // halfmove clock at 99 ->  1 move away from draw

    const move = new Move(sq.F3, sq.E3, WHITE_KING);
    pos.playMove(move);

    expect(pos.gameOver()).toBe(true);
    expect(pos.result).toBe(DRAW);
    expect(pos.endState).toBe(FIFTY_MOVE_RULE);
  });

  test("draw by threefold repetition", () => {
    const pos = new Position();
    pos.loadFen("8/8/2k5/2p5/5P2/5K2/8/8 w - - 0 1");

    const closePos = new Position();
    closePos.loadFen("8/8/2k5/2p5/5P2/4K3/8/8 b - - 1 1"); // King moved 1 sq to left
    pos.pastPositions.set(closePos.zobristKey, 2);

    const move = new Move(sq.F3, sq.E3, WHITE_KING); // should reach closePos position for the 3rd time
    pos.playMove(move);
    console.log(pos.getFen())

    expect(pos.gameOver()).toBe(true);
    expect(pos.result).toBe(DRAW);
    expect(pos.endState).toBe(REPETITION);
  });

  test("stalemate", () => {
    const pos = new Position();
    pos.loadFen("k7/8/3Q4/8/8/4K3/8/8 w - - 0 1"); // wQ 1 sq away from stalemating

    const move = new Move(sq.D6, sq.C7, WHITE_QUEEN);
    pos.playMove(move);

    expect(pos.gameOver()).toBe(true);
    expect(pos.result).toBe(DRAW);
    expect(pos.endState).toBe(STALEMATE);
  });

  test("checkmate", () => {
    const pos = new Position();
    pos.loadFen("8/8/8/8/8/4k3/1q6/5K2 b - - 0 1"); // bQ 1 move away from checkmating

    const move = new Move(sq.B2, sq.F2, BLACK_QUEEN);
    pos.playMove(move);

    expect(pos.gameOver()).toBe(true);
    expect(pos.result).toBe(BLACK_WIN);
    expect(pos.endState).toBe(CHECKMATE);
  });

  test("game continues when legal moves exist", () => {
    const pos = new Position();

    pos.playMove(new Move(sq.E2, sq.E4, WHITE_PAWN));

    expect(pos.gameOver()).toBe(false);
    expect(pos.result).toBe(IN_PROGRESS);
    expect(pos.endState).toBe(IN_PROGRESS);
  });
});
