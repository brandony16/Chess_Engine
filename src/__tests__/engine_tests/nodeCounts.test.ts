import { describe, expect, test } from "vitest";
import { MinimaxV4 } from "../../engines/minimaxEngines/quiescence.ts";
import { MinimaxV5 } from "../../engines/minimaxEngines/transposTable.ts";
import { SearchContext } from "../../engines/searchContext.ts";
import { Position } from "../../game/Position.ts";
import { KIWIPETE_POS } from "../game_tests/fens.ts";

describe("better searches should have less nodes", () => {
  test("node counts are less depth 4", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const quiesce = new MinimaxV4(4);
    const transpos = new MinimaxV5(4);

    const ctx = new SearchContext();

    const m1 = quiesce.search(pos, ctx);
    const nodeCt1 = ctx.nodesSearched;
    ctx.reset();

    const m2 = transpos.search(pos, ctx);
    const nodeCt2 = ctx.nodesSearched;
    ctx.reset();

    console.log(`W/O TT: ${nodeCt1}\nW/ TT: ${nodeCt2}`);

    expect(nodeCt2).toBeLessThan(nodeCt1);

    // evaluation is the same, move should be the same
    expect(m2).toEqual(m1);
  });
  
  test("node counts are less depth 5", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const quiesce = new MinimaxV4(5);
    const transpos = new MinimaxV5(5);

    const ctx = new SearchContext();

    const m1 = quiesce.search(pos, ctx);
    const nodeCt1 = ctx.nodesSearched;
    ctx.reset();

    const m2 = transpos.search(pos, ctx);
    const nodeCt2 = ctx.nodesSearched;
    ctx.reset();

    console.log(`W/O TT: ${nodeCt1}\nW/ TT: ${nodeCt2}`);

    expect(nodeCt2).toBeLessThan(nodeCt1);

    // evaluation is the same, move should be the same
    expect(m2).toEqual(m1);
  });

  test("node counts are less depth 6", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const quiesce = new MinimaxV4(6);
    const transpos = new MinimaxV5(6);

    const ctx = new SearchContext();

    const m1 = quiesce.search(pos, ctx);
    const nodeCt1 = ctx.nodesSearched;
    ctx.reset();

    const m2 = transpos.search(pos, ctx);
    const nodeCt2 = ctx.nodesSearched;
    ctx.reset();

    console.log(`W/O TT: ${nodeCt1}\nW/ TT: ${nodeCt2}`);

    expect(nodeCt2).toBeLessThan(nodeCt1);

    // evaluation is the same, move should be the same
    expect(m2).toEqual(m1);
  });
});
