import { Position } from "../../game/Position.ts";
import { MinimaxV1 } from "../minimaxEngines/v1/basicMinimax.ts";

const basic = new MinimaxV1(5);
const pos = new Position();

const start = performance.now();
basic.search(pos, 100);
const end = performance.now();

const time = (end - start) / 1000;
console.log(`Time: ${time.toFixed(2)}s`);
console.log(`nodes: ${basic.nodesSearched}`);
console.log(`nps: ${(basic.nodesSearched / time).toFixed(0)}`);
