import { EngineTypes } from "../../utilTypes.ts";
import { BMV1 } from "../../../engines/BondMonkeyV1.mjs";
import { BMV2 } from "../../../engines/BMV2/BondMonkeyV2.mjs";
import { BMV3 } from "../../../engines/BMV3/BondMonkeyV3.mjs";
import { BMV4 } from "../../../engines/BMV4/BondMonkeyV4.mjs";
import { BMV5 } from "../../../engines/BMV5/BondMonkeyV5.mjs";
import { BMV6 } from "../../../engines/BMV6/BondMonkeyV6.mjs";

export const engineRegistry = {
  [EngineTypes.BMV1]: BMV1,
  [EngineTypes.BMV2]: BMV2,
  [EngineTypes.BMV3]: BMV3,
  [EngineTypes.BMV4]: BMV4,
  [EngineTypes.BMV5]: BMV5,
  [EngineTypes.BMV6]: BMV6,
};
