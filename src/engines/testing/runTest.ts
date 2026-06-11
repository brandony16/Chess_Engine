import { BondmonkeyV10 } from "../bondmonkeyVersions/v10.ts";
import { BondmonkeyV11 } from "../bondmonkeyVersions/v11.ts";
import { BondmonkeyV11_2 } from "../bondmonkeyVersions/v11_2.ts";
import { BondmonkeyV12 } from "../bondmonkeyVersions/v12.ts";
import { BondmonkeyV13 } from "../bondmonkeyVersions/v13.ts";
import { BondmonkeyV14 } from "../bondmonkeyVersions/v14.ts";
import { BondmonkeyV15 } from "../bondmonkeyVersions/v15.ts";
import { BondmonkeyV16 } from "../bondmonkeyVersions/v16.ts";
import { BondmonkeyV17 } from "../bondmonkeyVersions/v17.ts";
import { BondmonkeyV18 } from "../bondmonkeyVersions/v18.ts";
import { BondmonkeyV19 } from "../bondmonkeyVersions/v19.ts";
import { BondmonkeyV2 } from "../bondmonkeyVersions/v2.ts";
import { BondmonkeyV3 } from "../bondmonkeyVersions/v3.ts";
import { BondmonkeyV4 } from "../bondmonkeyVersions/v4.ts";
import { BondmonkeyV5 } from "../bondmonkeyVersions/v5.ts";
import { BondmonkeyV6 } from "../bondmonkeyVersions/v6.ts";
import { BondmonkeyV7 } from "../bondmonkeyVersions/v7.ts";
import { BondmonkeyV8 } from "../bondmonkeyVersions/v8.ts";
import { BondmonkeyV9 } from "../bondmonkeyVersions/v9.ts";
import { MAX_SEARCH_PLY } from "../Engine.ts";
import { DEF_TIME_CONTROL, type ClockType } from "../searchContext.ts";
import { runMatch } from "./fullMatches.ts";
import type { EngineConfig } from "./matchWorker.ts";
import { sprt } from "./SPRT.ts";

async function main() {
  const control: ClockType = DEF_TIME_CONTROL;

  // v5 is a solid base version, with ab pruining and basic move ordering
  const eng1: EngineConfig = {
    version: BondmonkeyV19.name,
    depth: MAX_SEARCH_PLY,
  };

  const eng2: EngineConfig = {
    version: BondmonkeyV18.name,
    depth: MAX_SEARCH_PLY,
  };

  const start = performance.now();
  const result = await sprt(eng1, eng2, control);
  // const result = await runMatch(eng1, eng2, 100, control);
  const end = performance.now();

  const time = ((end - start) / 1000).toFixed(2); // get time in seconds
  console.log(result);
  console.log(time + "s");
}

main();
