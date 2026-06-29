import { expect, test, describe } from "vitest";
import { Position } from "../../game/Position.ts";
import { moveToUCI, uciToMove } from "../../game/fenAndUCI/uciHelpers.ts";
import { BondmonkeyV19 } from "../../engines/bondmonkeyVersions/v19.ts";
import { MAX_SEARCH_PLY } from "../../engines/Engine.ts";
import { SearchContext } from "../../engines/searchContext.ts";

describe("UCI History Loop Replay Tests", () => {
  test("Replaying a sequence with castling does not desync board state", () => {
    const pos = new Position();

    // Sequence where White castles kingside on move 5
    const moves = [
      "e2e4",
      "e7e5",
      "g1f3",
      "b8c6",
      "f1b5",
      "g8f6",
      "e1g1",
      "f8e7",
    ];

    for (const uciMove of moves) {
      const move = uciToMove(uciMove, pos);
      expect(move).not.toBeUndefined();
      pos.makeMove(move);
    }

    // Verify that the piece placements match a known FEN exactly
    const finalFen = pos.getFen();
    expect(finalFen).toBe(
      "r1bqk2r/ppppbppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 6 5",
    ); // Black king castled or prepared
  });

  test("Replaying an exact game line up to a complex tactic matches legal validation", () => {
    const pos = new Position();

    // Feed it a mock list simulating what lichess-bot parses
    const moves = [
      "e2e4",
      "e7e5",
      "f2f4",
      "e5f4",
      "g1f3",
      "g7g5",
      "h2h4",
      "g5g4",
      "f3e5",
      "d7d6",
    ];

    expect(() => {
      for (const uciMove of moves) {
        const move = uciToMove(uciMove, pos);
        pos.makeMove(move);
      }
    }).not.toThrow();
  });

  test("uciToMove unique structural safety testing", () => {
    const pos = new Position();

    // Verify 1st ply move is found
    const move1 = uciToMove("e2e4", pos);
    expect(moveToUCI(move1)).toBe("e2e4");
    pos.makeMove(move1);

    // Verify 2nd ply move can be retrieved safely from the next history buffer level
    const move2 = uciToMove("e7e5", pos);
    expect(moveToUCI(move2)).toBe("e7e5");
  });

  test("relaying an entire game", () => {
    const pos = new Position();

    const moves = [
      "e2e4",
      "c7c5",
      "b1c3",
      "b8c6",
      "f2f4",
      "d8c7",
      "d2d3",
      "d7d6",
      "g1f3",
      "g8f6",
      "f1e2",
      "c8g4",
      "e1g1",
      "e7e6",
      "h2h3",
      "g4f3",
      "e2f3",
      "f8e7",
      "c3e2",
      "e8g8",
      "c2c3",
      "a8d8",
      "d1e1",
      "a7a6",
      "g2g4",
      "e6e5",
      "g4g5",
      "f6d7",
      "f4f5",
      "f7f6",
      "h3h4",
      "c7b8",
      "e1g3",
      "d8c8",
      "g5f6",
      "f8f6",
      "g1h2",
      "f6f7",
      "c1g5",
      "e7f6",
      "f1g1",
      "c8f8",
      "f3h5",
      "f7e7",
      "h5f3",
    ];

    for (const uciMove of moves) {
      const move = uciToMove(uciMove, pos);
      expect(move).not.toBeUndefined();
      pos.makeMove(move);
    }

    expect(pos.validate()).toBe(true);
    const fen = pos.getFen();
    expect(fen.split(" ")[0]).toBe(
      "1q3rk1/1p1nr1pp/p1np1b2/2p1pPB1/4P2P/2PP1BQ1/PP2N2K/R5R1",
    );
  });
});
