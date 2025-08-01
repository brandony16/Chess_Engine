import React from "react";
import PropTypes from "prop-types";

import EngineSettings from "./engineSetting";

export const Setting = ({
  engine1,
  setEngine1,
  depth1,
  setDepth1,
  engine2,
  setEngine2,
  depth2,
  setDepth2,
  numGames,
  setNumGames,
  startBattle,
}) => {
  return (
    <>
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
    </>
  );
};

Setting.propTypes = {
  engine1: PropTypes.string.isRequired,
  setEngine1: PropTypes.func.isRequired,
  depth1: PropTypes.number.isRequired,
  setDepth1: PropTypes.func.isRequired,
  engine2: PropTypes.string.isRequired,
  setEngine2: PropTypes.func.isRequired,
  depth2: PropTypes.number.isRequired,
  setDepth2: PropTypes.func.isRequired,
  numGames: PropTypes.number.isRequired,
  setNumGames: PropTypes.func.isRequired,
  startBattle: PropTypes.func.isRequired,
};

const MemoizedSetting = React.memo(Setting);
MemoizedSetting.displayName = "Setting";

export default MemoizedSetting;
