import { describe, expect, test } from "vitest";
import { TranspositionTable } from "../../engines/transpositionTable/table.ts";
import {
  TT_EXACT,
  TT_LOWERBOUND,
} from "../../engines/transpositionTable/ttTypes.ts";
import { encodeMove } from "../../game/moveMaking/move.ts";
import { sq, WHITE_PAWN } from "../../game/chessConstants.ts";
import { Position } from "../../game/Position.ts";
import { MinimaxV5 } from "../../engines/minimaxEngines/transposTable.ts";
import { SearchContext } from "../../engines/searchContext.ts";

describe("tt basic functions", () => {
  test("TT stores and retrieves exact entry", () => {
    const tt = new TranspositionTable(8); // Small for testing
    const hashLo = 0x123456;
    const hashHi = 0xabcdef;
    const move = encodeMove(sq.E2, sq.E4, WHITE_PAWN);

    tt.store(hashLo, hashHi, 5, 100, TT_EXACT, move, 0);

    const entryIdx = tt.probe(hashLo, hashHi);

    expect(entryIdx).not.toBe(-1);
    expect(tt.getDepth(entryIdx)).toBe(5);
    expect(tt.getScore(entryIdx, 0)).toBe(100);
    expect(tt.getFlag(entryIdx)).toBe(TT_EXACT);
    expect(tt.getMove(entryIdx)).toBe(move);
  });

  test("TT handles index collisions correctly", () => {
    const tt = new TranspositionTable(8);

    // idx is determined by keyLo, so same keyLo with diff keyHi leads to collision
    const hashLo = 0x123456;
    const hashHi1 = 0x100000;
    const hashHi2 = 0x1c0000;

    const move = encodeMove(sq.E2, sq.E4, WHITE_PAWN);
    tt.store(hashLo, hashHi1, 3, 100, TT_EXACT, move, 0);
    tt.store(hashLo, hashHi2, 5, 50, TT_LOWERBOUND, move, 0);

    // second store should replace first
    const entryIdx1 = tt.probe(hashLo, hashHi1);
    const entryIdx2 = tt.probe(hashLo, hashHi2);

    expect(entryIdx1).toBe(-1);
    expect(entryIdx2).not.toBe(-1);
    expect(tt.getDepth(entryIdx2)).toBe(5);
    expect(tt.getScore(entryIdx2, 0)).toBe(50);
    expect(tt.getFlag(entryIdx2)).toBe(TT_LOWERBOUND);
  });

  test("TT doesnt use stale entries from different position", () => {
    const tt = new TranspositionTable(16);
    const hash1 = 0x1;
    const hash2 = 0x2;

    tt.store(hash1, 0x1, 5, 100, TT_EXACT, 0, 0);

    // Probe with different hash - should not return hash1's entry
    const idx = tt.probe(hash2, 0x1);

    expect(idx).toBe(-1);
  });
});

describe("TT usage in search", () => {
  test("TT is used in search", () => {
    const pos = new Position();

    const engine = new MinimaxV5(6);
    const ctx = new SearchContext();

    // First search populates tt
    const start1 = performance.now();
    engine.search(pos, ctx);
    const end1 = performance.now();
    const searched1 = ctx.nodesSearched;

    ctx.reset();

    // Fully populated tt should lead to much faster search
    const start2 = performance.now();
    engine.search(pos, ctx);
    const end2 = performance.now();
    const searched2 = ctx.nodesSearched;

    console.log(
      `Unpopulated TT Nodes: ${searched1}\nPopulated TT Nodes: ${searched2}`,
    );
    const t1 = ((end1 - start1) / 1000).toFixed(2);
    const t2 = ((end2 - start2) / 1000).toFixed(2);
    console.log(`Unpopulated TT Time: ${t1}\nPopulated TT Time: ${t2}`);

    expect(searched2).toBeLessThan(searched1);
    expect(end2 - start2).toBeLessThan(end1 - start1);
  });

  test("TT preserves root position", () => {
    const pos = new Position();
    const engine = new MinimaxV5(6);
    const ctx = new SearchContext();

    engine.search(pos, ctx);

    // Root position should still be in TT
    const ttIdx = engine.tt.probe(pos.zobristLo, pos.zobristHi);

    expect(ttIdx).not.toBe(-1);
    expect(engine.tt.getDepth(ttIdx)).toBe(6); // Should have depth 6 entry
  });

  test("TT logs", () => {
    const pos = new Position();
    const engine = new MinimaxV5(6);
    const ctx = new SearchContext();

    // First search
    engine.search(pos, ctx);

    console.log(`Nodes searched: ${ctx.nodesSearched}`);
    const ttEntriesAfterFirstSearch = engine.tt.keyLo.filter(
      (k) => k !== 0,
    ).length;
    console.log(`TT entries populated: ${ttEntriesAfterFirstSearch}`);

    // Check if root is in TT
    const rootIdx = engine.tt.probe(pos.zobristLo, pos.zobristHi);
    console.log(`Root in TT: ${rootIdx !== -1}`);
    if (rootIdx !== -1) {
      console.log(`Root depth: ${engine.tt.getDepth(rootIdx)}`);
    }

    ctx.reset();
    engine.tt.hits = 0;
    engine.tt.misses = 0;

    // Second search
    engine.search(pos, ctx);

    console.log(`Second search nodes: ${ctx.nodesSearched}`);
    console.log(`Second search probes: ${engine.tt.hits + engine.tt.misses}`);
    console.log(
      `Second search - Hits: ${engine.tt.hits}, Misses: ${engine.tt.misses}`,
    );
    console.log(
      `Hit rate: ${(engine.tt.hits / (engine.tt.hits + engine.tt.misses)).toFixed(3)}`,
    );
  });
});
