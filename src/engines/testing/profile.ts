import {
  KIWIPETE_POS,
  LOCKED_MIDDLEGAME,
  OPEN_MIDGAME,
  START_POS,
  TRANSPOSITION_ENDGAME,
} from "../../__tests__/game_tests/fens.ts";
import { moreThanOne } from "../../game/bb.ts";
import { moveToUCI } from "../../game/fenAndUCI/uciHelpers.ts";
import { MAX_MOVES, Position } from "../../game/Position.ts";
import { MAX_SEARCH_PLY } from "../Engine.ts";
import { evaluateV3 } from "../evaluation/evaluationV3.ts";
import { evaluateV4 } from "../evaluation/evaluationv4.ts";
import { evaluateV5 } from "../evaluation/evaluationV5.ts";
import { MinimaxV4 } from "../minimaxEngines/quiescence.ts";
import { MinimaxV5 } from "../minimaxEngines/transposTable.ts";
import { MinimaxV10 } from "../minimaxEngines/v10.ts";
import { MinimaxV7 } from "../minimaxEngines/v7.ts";
import { MinimaxV8 } from "../minimaxEngines/v8.ts";
import { MinimaxV9 } from "../minimaxEngines/v9.ts";
import { SearchContext } from "../searchContext.ts";

const nmp = new MinimaxV9(8);
const normal = new MinimaxV8(8);
const pos = new Position();
pos.loadFen(KIWIPETE_POS);

// warm up JIT
nmp.search(pos, evaluateV4, new SearchContext(100_000));

console.log("Starting PVS + LMR search");
const ctx = new SearchContext(Infinity, Infinity);
const start = performance.now();
const move1 = nmp.search(pos, evaluateV4, ctx, true);
const end = performance.now();

console.log("\nStarting Other search");
const ctx2 = new SearchContext(Infinity, Infinity);
const start2 = performance.now();
const move2 = normal.search(pos, evaluateV4, ctx2, true);
const end2 = performance.now();
console.log();

console.log(`Moves Match: ${move1 === move2}`);
console.log(
  `PVS + LMR Move: ${moveToUCI(move1)}\nOther Move: ${moveToUCI(move2)}\n`,
);

console.log(
  `\nPVS + LMR Time: ${((end - start) / 1000).toFixed(2)}\nOther Time: ${((end2 - start2) / 1000).toFixed(2)}`,
);
console.log(
  `PVS + LMR Nodes: ${ctx.nodesSearched}\nOther Nodes: ${ctx2.nodesSearched}`,
);
console.log(
  `PVS + LMR QNodes: ${ctx.quiescenceNodes}\nOther QNodes: ${ctx2.quiescenceNodes}`,
);
