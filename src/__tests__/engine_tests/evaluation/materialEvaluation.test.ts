import { describe, expect, it } from "vitest";
import { Position } from "../../../game/Position.ts";
import {
  pieceType,
  type EvalWeights,
} from "../../../engines/evaluation/Evaluation.ts";
import {
  BLACK_BISHOP,
  BLACK_KNIGHT,
  BLACK_QUEEN,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../../../game/chessConstants.ts";
import { evaluateV1 } from "../../../engines/evaluation/evaluationV1.ts";

describe("Evaluation is correct", () => {
  const evalWeights: EvalWeights = {
    pieceWeights: new Int32Array([0, 100, 300, 300, 500, 900, 1_000]),
  };

  it("should be 0 for the base position", () => {
    const pos = new Position();

    expect(evaluateV1(pos, evalWeights)).toBe(0);
  });

  it("should correctly calculate a white advantage from whites perspecive", () => {
    const pos = new Position();
    pos.loadFen("8/p2k1b2/2pp4/1p2n3/1P4N1/4PP2/3P1K1R/8 w - - 0 1");

    // White is up a rook for a bishop
    const expected =
      evalWeights.pieceWeights[pieceType(WHITE_ROOK)] -
      evalWeights.pieceWeights[pieceType(BLACK_BISHOP)];
    expect(evaluateV1(pos, evalWeights)).toBe(expected);
  });

  it("should correctly calculate a white advantage from blacks perspecive", () => {
    const pos = new Position();
    pos.loadFen("8/p2k1b2/2pp4/1p2n3/1P4N1/4PP2/3P1K1R/8 b - - 0 1");

    // White is up a rook for a bishop
    const expected =
      evalWeights.pieceWeights[pieceType(WHITE_ROOK)] -
      evalWeights.pieceWeights[pieceType(BLACK_BISHOP)];

    // Black to move, so eval should be negative (opponent is winning)
    expect(evaluateV1(pos, evalWeights)).toBe(-expected);
  });

  it("should correctly calculate a black advantage from whites perspecive", () => {
    const pos = new Position();
    pos.loadFen("8/p2k4/q1pp4/1p1nn3/1P4N1/4PP2/3P1K2/1R5R w - - 0 1");

    // Black is up a queen and knight for 2 rooks
    const weights = evalWeights.pieceWeights;
    const expected =
      2 * weights[pieceType(WHITE_ROOK)] -
      weights[pieceType(BLACK_QUEEN)] -
      weights[pieceType(BLACK_KNIGHT)];
    expect(evaluateV1(pos, evalWeights)).toBe(expected);
  });

  it("should correctly calculate a white advantage from blacks perspecive", () => {
    const pos = new Position();
    pos.loadFen("8/p2k4/q1pp4/1p1nn3/1P4N1/4PP2/3P1K2/1R5R b - - 0 1");

    // Black is up a queen and knight for 2 rooks
    const weights = evalWeights.pieceWeights;
    const expected =
      2 * weights[pieceType(WHITE_ROOK)] -
      weights[pieceType(BLACK_QUEEN)] -
      weights[pieceType(BLACK_KNIGHT)];

    // Black is now up material
    expect(evaluateV1(pos, evalWeights)).toBe(-expected);
  });
});
