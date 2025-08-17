import { EngineTypes } from "../utilTypes";
import { BMV1 } from "./BondMonkeyV1.mjs";
import { BMV2 } from "./BMV2/BondMonkeyV2.mjs";
import { BMV3 } from "./BMV3/BondMonkeyV3.mjs";
import { BMV4 } from "./BMV4/BondMonkeyV4.mjs";
import { BMV5 } from "./BMV5/BondMonkeyV5.mjs";
import { BMV6 } from "./BMV6/BondMonkeyV6.mjs";

export const engineRegistry = {
  [EngineTypes.BMV1]: BMV1,
  [EngineTypes.BMV2]: BMV2,
  [EngineTypes.BMV3]: BMV3,
  [EngineTypes.BMV4]: BMV4,
  [EngineTypes.BMV5]: BMV5,
  [EngineTypes.BMV6]: BMV6,
};
