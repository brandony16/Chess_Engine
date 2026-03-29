import { mulberry32 } from "../../random.ts";
import { MAX_SEARCH_PLY } from "../Engine.ts";
import { createMaterialEngine } from "../materialEngine.ts";
import { MinimaxV2 } from "../minimaxEngines/v1/abPruning.ts";
import { MinimaxV1 } from "../minimaxEngines/v1/basicMinimax.ts";
import { createRandomEngine } from "../randomEngine.ts";
import { runMatch } from "./fullMatches.ts";
import { sprt } from "./SPRT.ts";

async function main() {
  const random = createRandomEngine(mulberry32(16));
  const material = createMaterialEngine();
  const minimax = new MinimaxV1(MAX_SEARCH_PLY);
  const abPruning = new MinimaxV2(MAX_SEARCH_PLY);

  const nodeLimit = 10_000;

  const start = performance.now();
  const result = await sprt(abPruning, minimax, nodeLimit);
  // const result = await runMatch(abPruning, minimax, 100, nodeLimit, 16);
  const end = performance.now();

  const time = ((end - start) / 1000).toFixed(2); // get time in seconds
  console.log(result);
  console.log(time + "s");
}

main();
