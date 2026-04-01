import { mulberry32 } from "../../random.ts";
import { MAX_SEARCH_PLY } from "../Engine.ts";
import { createMaterialEngine } from "../materialEngine.ts";
import { MinimaxV2 } from "../minimaxEngines/abPruning.ts";
import { MinimaxV1 } from "../minimaxEngines/basicMinimax.ts";
import { MinimaxV3 } from "../minimaxEngines/moveOrdering.ts";
import { MinimaxV4 } from "../minimaxEngines/quiescence.ts";
import { MinimaxV5 } from "../minimaxEngines/transposTable.ts";
import { createRandomEngine } from "../randomEngine.ts";
import { runMatch } from "./fullMatches.ts";
import { sprt } from "./SPRT.ts";

async function main() {
  const random = createRandomEngine(mulberry32(16));
  const material = createMaterialEngine();
  const minimax = new MinimaxV1(MAX_SEARCH_PLY);
  const abPruning = new MinimaxV2(MAX_SEARCH_PLY);
  const moveOrdering = new MinimaxV3(MAX_SEARCH_PLY);
  const quiesce = new MinimaxV4(MAX_SEARCH_PLY);
  const transpos = new MinimaxV5(MAX_SEARCH_PLY);

  const nodeLimit = 10_000;

  const start = performance.now();
  // const result = await sprt(quiesce, moveOrdering, nodeLimit);
  const result = await runMatch(transpos, quiesce, 50, nodeLimit, 16);
  const end = performance.now();

  const time = ((end - start) / 1000).toFixed(2); // get time in seconds
  console.log(result);
  console.log(time + "s");
}

main();
