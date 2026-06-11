import { OPEN_MIDGAME } from "../../__tests__/game_tests/fens.ts";
import { Position } from "../../game/Position.ts";
import { evaluateV4 } from "../evaluation/evaluationv4.ts";
import { MinimaxV10 } from "../minimaxEngines/v10.ts";
import { DEF_NODE_LIMIT, NO_CONTROL, SearchContext } from "../searchContext.ts";

const eng = new MinimaxV10(10);
const pos = new Position();
const ctx = new SearchContext(NO_CONTROL);
pos.loadFen(OPEN_MIDGAME);

const warmupCtx = new SearchContext(DEF_NODE_LIMIT);

// Let JIT optimize hot paths
for (let i = 0; i < 1000; i++) {
  eng.search(pos, evaluateV4, warmupCtx);
}

eng.newGame();

// 1. Force a clean slate before measuring
if (typeof global.gc === "function") {
  global.gc();
  global.gc();
} else {
  console.warn("You must run this script with --expose-gc");
}

// 2. Take a snapshot of the clean heap
const startMemory = process.memoryUsage().heapUsed;

console.log("Starting search...");
const startT = performance.now();

// 3. Run your search
const move = eng.search(pos, evaluateV4, ctx, true);

// 4. Take a snapshot immediately after
const endT = performance.now();
const endMemory = process.memoryUsage().heapUsed;

// 5. Calculate the delta
const memoryUsedMB = (endMemory - startMemory) / 1024 / 1024;
const timeTimeSeconds = (endT - startT) / 1000;

console.log(`\n--- Benchmark Results ---`);
console.log(`NPS: ${(ctx.nodesSearched / timeTimeSeconds).toFixed(0)}`);
console.log(`Net Memory Allocated: ${memoryUsedMB.toFixed(2)} MB`);
