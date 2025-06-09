import PropTypes from "prop-types";
import { BMV1 } from "../bbEngines/BondMonkeyV1.mjs";
import "./BattleEngines.css";
import { BMV2 } from "../bbEngines/BMV2/BondMonkeyV2.mjs";
import { BMV3 } from "../bbEngines/BMV3/BondMonkeyV3.mjs";
import { BMV4 } from "../bbEngines/BMV4/BondMonkeyV4.mjs";
import { BMV5 } from "../bbEngines/BMV5/BondMonkeyV5.mjs";
import { useState } from "react";
import EngineSettings from "./battleEnginesComponents/engineSetting";

const BattleEngines = ({ battleEngines }) => {
  const nameToEngine = { // Put in utilTypes
    BondMonkeyV1: BMV1,
    BondMonkeyV2: BMV2,
    BondMonkeyV3: BMV3,
    BondMonkeyV4: BMV4,
    BondMonkeyV5: BMV5,
  };

  const [engine1, setEngine1] = useState("BondMonkeyV5");
  const [depth1, setDepth1] = useState(5);
  const [engine2, setEngine2] = useState("BondMonkeyV5");
  const [depth2, setDepth2] = useState(5);
  const [numGames, setNumGames] = useState(5);

  const startBattle = () => {
    const engine1Func = nameToEngine[engine1];
    const engine2Func = nameToEngine[engine2];

    battleEngines(engine1Func, depth1, engine2Func, depth2, numGames);
  };

  return (
    <div id="battleForm" className="battleEngines">
      <div className="engineSettingsWrap">
        <EngineSettings
          engineValue={engine1}
          depthValue={depth1}
          setEngine={setEngine1}
          setDepth={setDepth1}
          id="one"
        />
        <EngineSettings
          engineValue={engine2}
          depthValue={depth2}
          setEngine={setEngine2}
          setDepth={setDepth2}
          id="two"
        />
      </div>

      <div className="paramWrap">
        <div className="labelWrap">
          <legend>Games:</legend>
          <input
            type="number"
            name="games"
            id="games"
            step="1"
            className="numInput"
            max="100"
            min="1"
            value={numGames}
            onChange={(e) => setNumGames(Number(e.target.value))}
          />
        </div>
      </div>

      <button
        className="battle"
        type="submit"
        id="battle"
        onClick={() => startBattle()}
      >
        Start
      </button>
    </div>
  );
};

BattleEngines.propTypes = {
  battleEngines: PropTypes.func.isRequired,
};

export default BattleEngines;
