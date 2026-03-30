import { describe, expect, it } from "vitest";
import { MinimaxV1 } from "../../engines/minimaxEngines/basicMinimax.ts";
import { Position } from "../../game/Position.ts";
import { MinimaxV2 } from "../../engines/minimaxEngines/abPruning.ts";
import { KIWIPETE_POS, PINNED_POS } from "../game_tests/fens.ts";
import { SearchContext } from "../../engines/searchContext.ts";

describe("Minimax w ab pruning is the same as minimax w/o it", () => {
  it("should give the same move for starting pos at depth 2", () => {
    const basic = new MinimaxV1(2);
    const pruning = new MinimaxV2(2);

    const pos = new Position();

    const ctx = new SearchContext();
    const basicMove = basic.search(pos, ctx);
    const pruningMove = pruning.search(pos, ctx);
    expect(pruningMove).toBe(basicMove);
  });

  it("should give the same move for starting pos at depth 3", () => {
    const basic = new MinimaxV1(3);
    const pruning = new MinimaxV2(3);

    const pos = new Position();

    const ctx = new SearchContext();
    const basicMove = basic.search(pos, ctx);
    const pruningMove = pruning.search(pos, ctx);
    expect(pruningMove).toBe(basicMove);
  });

  it("should give the same move for starting pos at depth 5", () => {
    const basic = new MinimaxV1(5);
    const pruning = new MinimaxV2(5);

    const pos = new Position();

    const ctx = new SearchContext();
    const basicMove = basic.search(pos, ctx);
    const pruningMove = pruning.search(pos, ctx);
    expect(pruningMove).toBe(basicMove);
  });

  it("should give the same move for kiwipete at depth 2", () => {
    const basic = new MinimaxV1(2);
    const pruning = new MinimaxV2(2);

    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const ctx = new SearchContext();
    const basicMove = basic.search(pos, ctx);
    const pruningMove = pruning.search(pos, ctx);
    expect(pruningMove).toBe(basicMove);
  });

  it("should give the same move for kiwipete at depth 3", () => {
    const basic = new MinimaxV1(3);
    const pruning = new MinimaxV2(3);

    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const ctx = new SearchContext();
    const basicMove = basic.search(pos, ctx);
    const pruningMove = pruning.search(pos, ctx);
    expect(pruningMove).toBe(basicMove);
  });

  it("should give the same move for pinned pos at depth 2", () => {
    const basic = new MinimaxV1(2);
    const pruning = new MinimaxV2(2);

    const pos = new Position();
    pos.loadFen(PINNED_POS);

    const ctx = new SearchContext();
    const basicMove = basic.search(pos, ctx);
    const pruningMove = pruning.search(pos, ctx);
    expect(pruningMove).toBe(basicMove);
  });

  it("should give the same move for pinned pos at depth 3", () => {
    const basic = new MinimaxV1(3);
    const pruning = new MinimaxV2(3);

    const pos = new Position();
    pos.loadFen(PINNED_POS);

    const ctx = new SearchContext();
    const basicMove = basic.search(pos, ctx);
    const pruningMove = pruning.search(pos, ctx);
    expect(pruningMove).toBe(basicMove);
  });
});
