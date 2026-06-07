import { describe, expect, it } from "vitest";
import { Position } from "../../game/Position.ts";
import { createMaterialEngine } from "../../engines/materialEngine.ts";
import { MinimaxV1 } from "../../engines/minimaxEngines/basicMinimax.ts";
import { KIWIPETE_POS, KNIGHT_FORK_POS } from "../game_tests/fens.ts";
import { SearchContext } from "../../engines/searchContext.ts";
import { evaluateV1 } from "../../engines/evaluation/evaluationV1.ts";

describe("minimax should be the same as material at depth 1", () => {
  it("is the same for start pos", () => {
    const pos = new Position();

    const material = createMaterialEngine();
    const minimax = new MinimaxV1(1);

    const ctx = new SearchContext();
    const matMove = material.search(pos, evaluateV1, ctx);
    const minimaxMove = minimax.search(pos, evaluateV1, ctx);

    expect(minimaxMove).toBe(matMove);
  });

  it("is the same for kiwipete pos", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const material = createMaterialEngine();
    const minimax = new MinimaxV1(1);

    const ctx = new SearchContext();
    const matMove = material.search(pos, evaluateV1, ctx);
    const minimaxMove = minimax.search(pos, evaluateV1, ctx);

    expect(minimaxMove).toBe(matMove);
  });

  it("is the same for knight fork pos", () => {
    const pos = new Position();
    pos.loadFen(KNIGHT_FORK_POS);

    const material = createMaterialEngine();
    const minimax = new MinimaxV1(1);

    const ctx = new SearchContext();
    const matMove = material.search(pos, evaluateV1, ctx);
    const minimaxMove = minimax.search(pos, evaluateV1, ctx);

    expect(minimaxMove).toBe(matMove);
  });
});
