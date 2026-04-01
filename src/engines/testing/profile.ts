import { Position } from "../../game/Position.ts";
import { MinimaxV4 } from "../minimaxEngines/quiescence.ts";
import { MinimaxV5 } from "../minimaxEngines/transposTable.ts";
import { SearchContext } from "../searchContext.ts";

const engine = new MinimaxV5(8);
const eng2 = new MinimaxV4(8);
const pos = new Position();

const ctx = new SearchContext();
const ctx2 = new SearchContext();
const start = performance.now();
engine.search(pos, ctx);
eng2.search(pos, ctx2);
const end = performance.now();

console.log(
  `Nodes w/o TT: ${ctx2.nodesSearched}\nNodes w/ TT: ${ctx.nodesSearched}`,
);
const time = (end - start) / 1000;
console.log(`Time: ${time.toFixed(2)}s`);
console.log(`nodes: ${ctx.nodesSearched}`);
console.log(`nps: ${(ctx.nodesSearched / time).toFixed(0)}`);

console.log(
  `TT Hits: ${engine.tt.hits}\nTT Misses: ${engine.tt.misses}\nTT Cutoffs: ${engine.tt.cutoffs}`,
);
console.log(
  `Hit Rate: ${engine.tt.hits / (engine.tt.hits + engine.tt.misses)}`,
);
