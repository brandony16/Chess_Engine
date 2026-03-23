import { Position } from "../../../game/Position.ts";
import { perft } from "./perft.ts";

const pos = new Position();

const t0 = performance.now();
const nodes = perft(pos, 5);
const t1 = performance.now();

console.log(nodes, "nodes");
console.log("time (s):", ((t1 - t0) / 1000).toFixed(2));
console.log("nps:", Math.floor(nodes / ((t1 - t0) / 1000)));
