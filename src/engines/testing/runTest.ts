import { mulberry32 } from "../../random.ts";
import { createMaterialEngine } from "../materialEngine.ts";
import { createRandomEngine } from "../randomEngine.ts";
import { runMatch } from "./fullMatches.ts";
import { sprt } from "./SPRT.ts";

async function main() {
  const rng = mulberry32(16);
  const random = createRandomEngine(rng);
  const material = createMaterialEngine();

  const result = await sprt(material, random);
  // const result = await runMatch(material, random, 250, 100, 16);
  console.log(result);
}

main();
