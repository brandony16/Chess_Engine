import { describe, expect, it } from "vitest";
import { MinimaxV1 } from "../../engines/minimaxEngines/v1/basicMinimax.ts";
import { MAX_SEARCH_PLY } from "../../engines/Engine.ts";
import { SearchContext } from "../../engines/searchContext.ts";
import { Position } from "../../game/Position.ts";

describe("searches should not pass nodeLimit", () => {
  it("should be the same for low limit", () => {
    const pos = new Position();

    const minimax = new MinimaxV1(MAX_SEARCH_PLY);

    const nodeLimit = 1_000;
    const ctx = new SearchContext(nodeLimit);
    minimax.search(pos, ctx);

    expect(ctx.nodesSearched).toBe(nodeLimit);
  });

  it("should be the same for medium limit", () => {
    const pos = new Position();

    const minimax = new MinimaxV1(MAX_SEARCH_PLY);

    const nodeLimit = 50_000;
    const ctx = new SearchContext(nodeLimit);
    minimax.search(pos, ctx);

    expect(ctx.nodesSearched).toBe(nodeLimit);
  });

  it("should be the same for high limit", () => {
    const pos = new Position();

    const minimax = new MinimaxV1(MAX_SEARCH_PLY);

    const nodeLimit = 500_000;
    const ctx = new SearchContext(nodeLimit);
    minimax.search(pos, ctx);

    expect(ctx.nodesSearched).toBe(nodeLimit);
  });
});
