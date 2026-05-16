import { moreThanOne } from "../../game/bb.ts";
import { MAX_MOVES, Position } from "../../game/Position.ts";
import { evaluateV1 } from "../evaluation/evaluationV1.ts";
import { MinimaxV1 } from "../minimaxEngines/basicMinimax.ts";
import { MinimaxV4 } from "../minimaxEngines/quiescence.ts";
import { MinimaxV5 } from "../minimaxEngines/transposTable.ts";
import { SearchContext } from "../searchContext.ts";
import { TranspositionTable } from "../transpositionTable/table.ts";

const engine = new MinimaxV5(15);
const eng2 = new MinimaxV4(15);
const pos = new Position();
pos.loadFen("8/k7/3p4/p2P1p2/P2P1P2/8/8/K7 w - - 0 1");

const ctx = new SearchContext();
const ctx2 = new SearchContext();
const start = performance.now();
const result = engine.search(pos, evaluateV1, ctx);
// eng2.search(pos, ctx2);
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
