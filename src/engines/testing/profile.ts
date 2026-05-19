import {
  KIWIPETE_POS,
  LOCKED_MIDDLEGAME,
  OPEN_MIDGAME,
  TRANSPOSITION_ENDGAME,
} from "../../__tests__/game_tests/fens.ts";
import { moreThanOne } from "../../game/bb.ts";
import { MAX_MOVES, Position } from "../../game/Position.ts";
import { evaluateV3 } from "../evaluation/evaluationV3.ts";
import { MinimaxV4 } from "../minimaxEngines/quiescence.ts";
import { MinimaxV5 } from "../minimaxEngines/transposTable.ts";
import { MinimaxV7 } from "../minimaxEngines/v7.ts";
import { MinimaxV8 } from "../minimaxEngines/v8.ts";
import { SearchContext } from "../searchContext.ts";

const nmp = new MinimaxV8(8);
const normal = new MinimaxV7(8);
const pos = new Position();
pos.loadFen(OPEN_MIDGAME);

const ctx = new SearchContext(Infinity, Infinity);
const start = performance.now();
nmp.search(pos, evaluateV3, ctx);
const end = performance.now();

const ctx2 = new SearchContext(Infinity, Infinity);
const start2 = performance.now();
normal.search(pos, evaluateV3, ctx2);
const end2 = performance.now();

console.log(
  `NMP Time: ${((end - start) / 1000).toFixed(2)}\nOther Time: ${((end2 - start2) / 1000).toFixed(2)}`,
);
console.log(
  `NMP Nodes: ${ctx.nodesSearched}\nOther Nodes: ${ctx2.nodesSearched}`,
);
console.log(
  `TT Hits: ${nmp.tt.hits}\nTT Misses: ${nmp.tt.misses}\nTT Cutoffs: ${nmp.tt.cutoffs}`,
);
console.log(`Hit Rate: ${nmp.tt.hits / (nmp.tt.hits + nmp.tt.misses)}`);
