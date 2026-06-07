import { describe, expect, it } from "vitest";
import { Position } from "../../game/Position.ts";
import { see } from "../../engines/see.ts";
import { DEFAULT_PIECE_WEIGHTS } from "../../engines/evaluation/Evaluation.ts";
import { encodeMove } from "../../game/moveMaking/move.ts";
import {
  BLACK_BISHOP,
  BLACK_KNIGHT,
  BLACK_PAWN,
  sq,
  WHITE_BISHOP,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_ROOK,
} from "../../game/chessConstants.ts";

describe("SEE", () => {
  it("should calculate a single move sequence", () => {
    const fen = "1k1r4/1pp4p/p7/4p3/8/P5P1/1PP4P/2K1R3 w - - 0 1";
    const pos = new Position(fen);

    // basic rook capturing a pawn - no more capture backs after
    const move = encodeMove(sq.E1, sq.E5, WHITE_ROOK, BLACK_PAWN);
    const result = see(move, pos, DEFAULT_PIECE_WEIGHTS);

    expect(result).toBe(DEFAULT_PIECE_WEIGHTS[BLACK_PAWN]);
  });

  it("should calculate a move complex move sequence", () => {
    const fen = "1k1r3q/1ppn3p/p4b2/4p3/8/P2N2P1/1PP1R1BP/2K1Q3 w - - 0 1";
    const pos = new Position(fen);

    const weights = DEFAULT_PIECE_WEIGHTS;

    // should be a losing capture sequence
    const move = encodeMove(sq.D3, sq.E5, WHITE_KNIGHT, BLACK_PAWN);
    const result = see(move, pos, weights);

    const expected = weights[BLACK_PAWN] - weights[WHITE_KNIGHT];
    expect(result).toBe(expected);
  });

  it("should calculate a move sequence with pinned pieces", () => {
    // Slightly tweaked position from previous test case
    // removed black knight so the sequence now does win a pawn
    const fen = "1k1r3q/1pp4p/p4b2/4p3/8/P2N2P1/1PP1R1BP/2K1Q3 w - - 0 1";
    const pos = new Position(fen);

    const weights = DEFAULT_PIECE_WEIGHTS;
    const move = encodeMove(sq.D3, sq.E5, WHITE_KNIGHT, BLACK_PAWN);
    const result = see(move, pos, weights);

    const expected = weights[BLACK_PAWN];
    expect(result).toBe(expected);
  });

  it("should calculate a move sequence correctly with black", () => {
    const fen = "1k2r2q/1pp3bp/p7/4P3/8/P2N2P1/1PP1R1BP/2K4Q b - - 0 1";
    const pos = new Position(fen);

    const weights = DEFAULT_PIECE_WEIGHTS;
    const move = encodeMove(sq.G7, sq.E5, BLACK_BISHOP, WHITE_PAWN);
    const result = see(move, pos, weights);

    const expected =
      weights[WHITE_PAWN] - weights[BLACK_BISHOP] + weights[WHITE_KNIGHT];
    expect(result).toBe(expected);
  });

  it("should calculate a long capture sequence correctly", () => {
    const fen =
      "1k2r1rq/1ppn3p/p1bp1b2/4p3/3P4/P1BNR1P1/1PP1R1BP/2K1Q3 w - - 0 1";
    const pos = new Position(fen);

    const weights = DEFAULT_PIECE_WEIGHTS;
    const move = encodeMove(sq.D4, sq.E5, WHITE_PAWN, BLACK_PAWN);
    const result = see(move, pos, weights);

    const expected = weights[BLACK_PAWN];
    expect(result).toBe(expected);
  });
});
