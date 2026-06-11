import { describe, expect, it } from "vitest";
import { MinimaxV1 } from "../../engines/minimaxEngines/basicMinimax.ts";
import { MAX_SEARCH_PLY } from "../../engines/Engine.ts";
import {
  ContextType,
  DEF_TIME_CONTROL,
  SearchContext,
} from "../../engines/searchContext.ts";
import { Position } from "../../game/Position.ts";
import { evaluateV1 } from "../../engines/evaluation/evaluationV1.ts";

describe("searches should not pass nodeLimit", () => {
  it("should be the same for low limit", () => {
    const pos = new Position();

    const minimax = new MinimaxV1(MAX_SEARCH_PLY);

    const nodeLimit = 1_000;
    const ctx = new SearchContext({
      type: ContextType.NODE_LIMIT,
      maxNodeCt: nodeLimit,
    });
    minimax.search(pos, evaluateV1, ctx);

    expect(ctx.nodesSearched).toBe(nodeLimit);
  });

  it("should be the same for medium limit", () => {
    const pos = new Position();

    const minimax = new MinimaxV1(MAX_SEARCH_PLY);

    const nodeLimit = 50_000;
    const ctx = new SearchContext({
      type: ContextType.NODE_LIMIT,
      maxNodeCt: nodeLimit,
    });
    minimax.search(pos, evaluateV1, ctx);

    expect(ctx.nodesSearched).toBe(nodeLimit);
  });

  it("should be the same for high limit", () => {
    const pos = new Position();

    const minimax = new MinimaxV1(MAX_SEARCH_PLY);

    const nodeLimit = 500_000;
    const ctx = new SearchContext({
      type: ContextType.NODE_LIMIT,
      maxNodeCt: nodeLimit,
    });
    minimax.search(pos, evaluateV1, ctx);

    expect(ctx.nodesSearched).toBe(nodeLimit);
  });
});

describe("searches should not pass timeLimit", () => {
  it("should be the same for low limit", () => {
    const pos = new Position();

    const minimax = new MinimaxV1(MAX_SEARCH_PLY);

    const timeLimit = 10;
    const ctx = new SearchContext({
      type: ContextType.FIXED_TIME,
      maxTimeMs: timeLimit,
    });

    const start = Date.now();
    minimax.search(pos, evaluateV1, ctx);
    const end = Date.now();

    const elapsed = Math.round(end - start);

    // incorporate a small margin for lag
    expect(elapsed - 2).toBeLessThanOrEqual(timeLimit);
  });

  it("should be the same for medium limit", () => {
    const pos = new Position();

    const minimax = new MinimaxV1(MAX_SEARCH_PLY);

    const timeLimit = 100;
    const ctx = new SearchContext({
      type: ContextType.FIXED_TIME,
      maxTimeMs: timeLimit,
    });

    const start = Date.now();
    minimax.search(pos, evaluateV1, ctx);
    const end = Date.now();

    const elapsed = Math.round(end - start);

    // incorporate a small margin for lag
    expect(elapsed - 2).toBeLessThanOrEqual(timeLimit);
  });

  it("should be the same for high limit", () => {
    const pos = new Position();

    const minimax = new MinimaxV1(MAX_SEARCH_PLY);

    const timeLimit = 1000;
    const ctx = new SearchContext({
      type: ContextType.FIXED_TIME,
      maxTimeMs: timeLimit,
    });

    const start = Date.now();
    minimax.search(pos, evaluateV1, ctx);
    const end = Date.now();

    const elapsed = Math.round(end - start);

    // incorporate a small margin for lag
    expect(elapsed - 2).toBeLessThanOrEqual(timeLimit);
  });
});

describe("time control settting should work", () => {
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  it("should track the time correctly within a search within 5ms", () => {
    const pos = new Position();
    const minimax = new MinimaxV1(MAX_SEARCH_PLY);
    const ctx = new SearchContext({
      type: ContextType.TIME_CONTROL,
      timePerPlayer: 10000,
      increment: 0,
    }); // 10 seconds

    const start = Date.now();
    minimax.search(pos, evaluateV1, ctx);
    const end = Date.now();

    const elapsed = end - start;
    const trackedByContext = 10000 - ctx.timeRemaining;

    // The difference between what we measured and what the context measured should be small
    const lagDiff = Math.abs(elapsed - trackedByContext);

    expect(lagDiff).toBeLessThanOrEqual(5);
  });

  it("should deduct elapsed time from timeRemaining", async () => {
    const ctx = new SearchContext({
      type: ContextType.TIME_CONTROL,
      timePerPlayer: 10000,
      increment: 0,
    });

    ctx.startSearch();

    await sleep(100);

    ctx.endSearch();

    // Verify it deducted roughly 100ms (again, using a margin of error for the sleep timer)
    const deductedTime = 10000 - ctx.timeRemaining;

    expect(deductedTime).toBeGreaterThanOrEqual(95);
    expect(deductedTime).toBeLessThanOrEqual(115);
  });
});
