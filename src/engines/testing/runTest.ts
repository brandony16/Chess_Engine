import { mulberry32 } from "../../random.ts";
import { BondmonkeyV1 } from "../bondmonkeyVersions/v1.ts";
import { BondmonkeyV2 } from "../bondmonkeyVersions/v2.ts";
import { BondmonkeyV3 } from "../bondmonkeyVersions/v3.ts";
import { BondmonkeyV4 } from "../bondmonkeyVersions/v4.ts";
import { BondmonkeyV5 } from "../bondmonkeyVersions/v5.ts";
import { BondmonkeyV6 } from "../bondmonkeyVersions/v6.ts";
import { BondmonkeyV7 } from "../bondmonkeyVersions/v7.ts";
import { BondmonkeyV8 } from "../bondmonkeyVersions/v8.ts";
import { MAX_SEARCH_PLY } from "../Engine.ts";
import { runMatch } from "./fullMatches.ts";
import { sprt } from "./SPRT.ts";

async function main() {
  const random = new BondmonkeyV1(mulberry32(16));
  const material = new BondmonkeyV2();
  const minimax = new BondmonkeyV3(MAX_SEARCH_PLY);
  const abPruning = new BondmonkeyV4(MAX_SEARCH_PLY);
  const moveOrdering = new BondmonkeyV5(MAX_SEARCH_PLY);
  const quiesce = new BondmonkeyV6(MAX_SEARCH_PLY);
  const psqt = new BondmonkeyV7(MAX_SEARCH_PLY);
  const endgameKingPos = new BondmonkeyV8(MAX_SEARCH_PLY);

  const nodeLimit = 10_000;

  const start = performance.now();
  // const result = await sprt(psqt, quiesce, nodeLimit);
  const result = await runMatch(endgameKingPos, psqt, 100, nodeLimit, 16);
  const end = performance.now();

  const time = ((end - start) / 1000).toFixed(2); // get time in seconds
  console.log(result);
  console.log(time + "s");
}

main();
