import { BondmonkeyV10 } from "../bondmonkeyVersions/v10.ts";
import { BondmonkeyV11 } from "../bondmonkeyVersions/v11.ts";
import { BondmonkeyV12 } from "../bondmonkeyVersions/v12.ts";
import { BondmonkeyV5 } from "../bondmonkeyVersions/v5.ts";
import { BondmonkeyV6 } from "../bondmonkeyVersions/v6.ts";
import { BondmonkeyV7 } from "../bondmonkeyVersions/v7.ts";
import { BondmonkeyV8 } from "../bondmonkeyVersions/v8.ts";
import { BondmonkeyV9 } from "../bondmonkeyVersions/v9.ts";
import { MAX_SEARCH_PLY } from "../Engine.ts";
import { runMatch } from "./fullMatches.ts";
import { sprt } from "./SPRT.ts";

async function main() {
  const moveOrdering = new BondmonkeyV5(MAX_SEARCH_PLY);
  const quiesce = new BondmonkeyV6(MAX_SEARCH_PLY);
  const psqt = new BondmonkeyV7(MAX_SEARCH_PLY);
  const endgameKingPos = new BondmonkeyV8(MAX_SEARCH_PLY);
  const transpos = new BondmonkeyV9(MAX_SEARCH_PLY);
  const v10 = new BondmonkeyV10(MAX_SEARCH_PLY);
  const v11 = new BondmonkeyV11(MAX_SEARCH_PLY);
  const v12 = new BondmonkeyV12(MAX_SEARCH_PLY);

  const nodeLimit = 25_000;

  const start = performance.now();
  // const result = await sprt(psqt, quiesce, nodeLimit);
  const result = await runMatch(v12, v11, 100, nodeLimit, 16);
  const end = performance.now();

  const time = ((end - start) / 1000).toFixed(2); // get time in seconds
  console.log(result);
  console.log(time + "s");
}

main();
