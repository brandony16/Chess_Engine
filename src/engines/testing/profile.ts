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
import EvaluationV5 from "../evaluation/evalModules/v5.ts";
import EvaluationV6 from "../evaluation/evalModules/v6.ts";
import { evaluateV3 } from "../evaluation/evaluationV3.ts";
import { evaluateV4 } from "../evaluation/evaluationv4.ts";
import { MinimaxV4 } from "../minimaxEngines/quiescence.ts";
import { MinimaxV5 } from "../minimaxEngines/transposTable.ts";
import { MinimaxV10 } from "../minimaxEngines/v10.ts";
import { MinimaxV11 } from "../minimaxEngines/v11.ts";
import { MinimaxV12 } from "../minimaxEngines/v12.ts";
import { MinimaxV13 } from "../minimaxEngines/v13.ts";
import { MinimaxV6 } from "../minimaxEngines/v6.ts";
import { MinimaxV7 } from "../minimaxEngines/v7.ts";
import { MinimaxV7_2 } from "../minimaxEngines/v7_2.ts";
import { MinimaxV8 } from "../minimaxEngines/v8.ts";
import { MinimaxV9 } from "../minimaxEngines/v9.ts";
import {
  ContextType,
  HIGH_NODE_LIMIT,
  NO_CONTROL,
  SearchContext,
} from "../searchContext.ts";

const eng1 = new MinimaxV13(12);
const eng2 = new MinimaxV12(12);
const pos = new Position(OPEN_MIDGAME);

// warm up JIT
eng1.search(pos, new EvaluationV6(), new SearchContext(HIGH_NODE_LIMIT));
eng1.newGame(); // reset to clear tt

console.log("Starting Eng 1 search");
const ctx = new SearchContext(NO_CONTROL);
const evaluation = new EvaluationV6();
const start = performance.now();
const move1 = eng1.search(pos, evaluation, ctx, true);
const end = performance.now();

// warm up JIT
eng2.search(pos, new EvaluationV6(), new SearchContext(HIGH_NODE_LIMIT));
eng2.newGame(); // reset to clear tt

console.log("\nStarting Eng 2 search");
const ctx2 = new SearchContext(NO_CONTROL);
const eval2 = new EvaluationV6();
const start2 = performance.now();
const move2 = eng2.search(pos, eval2, ctx2, true);
const end2 = performance.now();
console.log();

const time1 = (end - start) / 1000;
const time2 = (end2 - start2) / 1000;

console.log(`Moves Match: ${move1 === move2}`);
console.log(
  `Eng 1 Move: ${moveToUCI(move1)}\nEng 2 Move: ${moveToUCI(move2)}\n`,
);

console.log(
  `\nEng 1 Time: ${time1.toFixed(2)}\nEng 2 Time: ${time2.toFixed(2)}`,
);
console.log(
  `Eng 1 Nodes: ${ctx.nodesSearched}\nEng 2 Nodes: ${ctx2.nodesSearched}`,
);
console.log(
  `Eng 1 NPS: ${(ctx.nodesSearched / time1).toFixed(0)}\nEng 2 NPS: ${(ctx2.nodesSearched / time2).toFixed(0)}`,
);
console.log(
  `Eng 1 QNodes: ${ctx.quiescenceNodes}\nEng 2 QNodes: ${ctx2.quiescenceNodes}`,
);
