import { Position } from "../../game/Position.ts";
import { MinimaxV1 } from "../minimaxEngines/basicMinimax.ts";
import { SearchContext } from "../searchContext.ts";

const basic = new MinimaxV1(5);
const pos = new Position();

const ctx = new SearchContext();
const start = performance.now();
basic.search(pos, ctx);
const end = performance.now();

const time = (end - start) / 1000;
console.log(`Time: ${time.toFixed(2)}s`);
console.log(`nodes: ${ctx.nodesSearched}`);
console.log(`nps: ${(ctx.nodesSearched / time).toFixed(0)}`);
