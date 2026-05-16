import { KIWIPETE_POS, TRANSPOSITION_ENDGAME } from "../../__tests__/game_tests/fens.ts";
import { moreThanOne } from "../../game/bb.ts";
import { MAX_MOVES, Position } from "../../game/Position.ts";
import { evaluateV3 } from "../evaluation/evaluationV3.ts";
import { MinimaxV4 } from "../minimaxEngines/quiescence.ts";
import { MinimaxV5 } from "../minimaxEngines/transposTable.ts";
import { SearchContext } from "../searchContext.ts";

const ttengine = new MinimaxV5(20);
const nonTTEngine = new MinimaxV4(20);
const pos = new Position();
pos.loadFen(TRANSPOSITION_ENDGAME);

const ctx = new SearchContext();
const ctx2 = new SearchContext();
const start = performance.now();
const result = ttengine.search(pos, evaluateV3, ctx);
const end = performance.now();

const start2 = performance.now();
nonTTEngine.search(pos, evaluateV3, ctx2);
const end2 = performance.now();

console.log(
  `Time w/o TT: ${((end2 - start2) / 1000).toFixed(2)}s\nTime w/ TT: ${((end - start) / 1000).toFixed(2)}`,
);
console.log(
  `Nodes w/o TT: ${ctx2.nodesSearched}\nNodes w/ TT: ${ctx.nodesSearched}`,
);
console.log(
  `TT Hits: ${ttengine.tt.hits}\nTT Misses: ${ttengine.tt.misses}\nTT Cutoffs: ${ttengine.tt.cutoffs}`,
);
console.log(
  `Hit Rate: ${ttengine.tt.hits / (ttengine.tt.hits + ttengine.tt.misses)}`,
);
