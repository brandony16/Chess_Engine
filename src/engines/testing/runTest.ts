import { mulberry32 } from "../../random.ts";
import { createMaterialEngine } from "../materialEngine.ts";
import { MinimaxV1 } from "../minimaxEngines/v1/basicMinimax.ts";
import { createRandomEngine } from "../randomEngine.ts";
import { runMatch } from "./fullMatches.ts";
import { sprt } from "./SPRT.ts";

async function main() {
  const random = createRandomEngine(mulberry32(16));
  const material = createMaterialEngine();
  const minimax = new MinimaxV1();

  // const result = await sprt(minimax, material);
  const result = await runMatch(material, random, 100, 100, 16);
  // const result = await runMatch(minimax, material, 100, 100, 16);
  console.log(result);
}

main();
