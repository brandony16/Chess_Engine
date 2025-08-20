import { EngineTypes } from "../utilTypes";
import { BMV1 } from "../../coreLogic/engines/BondMonkeyV1.mjs";
import { BMV2 } from "../../coreLogic/engines/BMV2/BondMonkeyV2.mjs";
import { BMV3 } from "../../coreLogic/engines/BMV3/BondMonkeyV3.mjs";
import { BMV4 } from "../../coreLogic/engines/BMV4/BondMonkeyV4.mjs";
import { BMV5 } from "../../coreLogic/engines/BMV5/BondMonkeyV5.mjs";
import { BMV6 } from "../../coreLogic/engines/BMV6/BondMonkeyV6.mjs";
import { BMV7 } from "../../coreLogic/engines/BMV7/BondMonkeyV7.mjs";

export const engineRegistry = {
  [EngineTypes.BMV1]: BMV1,
  [EngineTypes.BMV2]: BMV2,
  [EngineTypes.BMV3]: BMV3,
  [EngineTypes.BMV4]: BMV4,
  [EngineTypes.BMV5]: BMV5,
  [EngineTypes.BMV6]: BMV6,
  [EngineTypes.BMV7]: BMV7,
};
