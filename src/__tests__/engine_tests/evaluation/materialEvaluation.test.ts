import { describe, expect, it } from "vitest";
import { Position } from "../../../game/Position.ts";
import { evaluateMaterial } from "../../../engines/evaluation/materialEvaluation.ts";

describe("Evaluation is correct", () => {
  it("should be 0 for the base position", () => {
    const pos = new Position();

    expect(evaluateMaterial(pos)).toBe(0);
  });
});
