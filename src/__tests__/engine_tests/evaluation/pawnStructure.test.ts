import { describe, expect, it } from "vitest";
import { Position } from "../../../game/Position.ts";
import {
  evaluatePawnStructure,
  PASSED_PAWN_BONUS,
  PENALTY_DOUBLED,
  PENALTY_ISOLATED,
} from "../../../engines/evaluation/evalComponents/pawnStructure/evalPawnStructure.ts";
import { START_POS, TRANSPOSITION_ENDGAME } from "../../game_tests/fens.ts";

describe("pawn structure eval gives the correct bonuses and penalties", () => {
  const pos = new Position();

  it("should punish doubled pawns", () => {
    // white has doubled pawns
    pos.loadFen("5k2/1pp5/3p4/8/8/3P4/2PP1K2/8 w - - 0 1");

    expect(evaluatePawnStructure(pos)).toBe(PENALTY_DOUBLED);

    // black has doubled pawns
    pos.loadFen("5k2/1pp5/2p5/8/8/8/2PP1K2/8 w - - 0 1");
    expect(evaluatePawnStructure(pos)).toBe(-PENALTY_DOUBLED);
  });

  it("should punish isloated pawns", () => {
    // white has an isolated pawn
    pos.loadFen("5k2/1ppp4/8/8/8/8/PP1P1K2/8 w - - 0 1");

    expect(evaluatePawnStructure(pos)).toBe(PENALTY_ISOLATED);

    // black has an isolated pawns
    pos.loadFen("5k2/p1pp4/8/8/8/8/1PPP1K2/8 w - - 0 1");
    expect(evaluatePawnStructure(pos)).toBe(-PENALTY_ISOLATED);
  });

  it("should reward passed pawns", () => {
    // white has a passed pawn on the 5th rank
    pos.loadFen("5k2/p7/1p6/3P4/1PP5/8/5K2/8 w - - 0 1");

    expect(evaluatePawnStructure(pos)).toBe(PASSED_PAWN_BONUS[4]);

    // black has passed pawn on the 4th rank
    pos.loadFen("5k2/8/2p5/1p1P4/pPP5/8/5K2/8 w - - 0 1");
    expect(evaluatePawnStructure(pos)).toBe(-PASSED_PAWN_BONUS[7 - 3]);
  });

  it("should be 0 when there are no isolated, doubled, or passed pawns", () => {
    pos.loadFen(START_POS);

    expect(evaluatePawnStructure(pos)).toBe(0);
  });

  it("should be 0 when everything cancels out", () => {
    // both sides have 1 set of isolated doubled passed pawns
    pos.loadFen("8/3k4/4p3/4p3/6P1/4K1P1/8/8 w - - 0 1");

    expect(evaluatePawnStructure(pos)).toBe(0);
  });

  it("should be correct on the transposition endgame position", () => {
    pos.loadFen(TRANSPOSITION_ENDGAME); // 3 sets of isolated pawns each, but white has doubled pawns

    expect(evaluatePawnStructure(pos)).toBe(PENALTY_DOUBLED + PENALTY_ISOLATED);
  });
});
