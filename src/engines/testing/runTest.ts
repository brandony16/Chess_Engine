import { mulberry32 } from "../../random.ts";
import { createMaterialEngine } from "../materialEngine.ts";
import { MinimaxV2 } from "../minimaxEngines/v1/abPruning.ts";
import { MinimaxV1 } from "../minimaxEngines/v1/basicMinimax.ts";
import { createRandomEngine } from "../randomEngine.ts";
import { runMatch } from "./fullMatches.ts";
import { sprt } from "./SPRT.ts";

async function main() {
  const random = createRandomEngine(mulberry32(16));
  const material = createMaterialEngine();
  const minimax = new MinimaxV1(2);
  const abPruning = new MinimaxV2(3);

  const start = performance.now();
  const result = await sprt(abPruning, minimax);
  // const result = await runMatch(abPruning, minimax, 100, 100, 16);
  const end = performance.now();

  const time = ((end - start) / 1000).toFixed(2) // get time in seconds
  console.log(result);
  console.log(time + "s");
}

main();
