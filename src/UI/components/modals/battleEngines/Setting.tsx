import React, { type Dispatch, type SetStateAction } from "react";

import EngineSettings from "./EngineSetting.tsx";
import type { EngineName } from "../../../../engines/bondmonkeyVersions/engineList.ts";

type SettingProps = {
  engine1: EngineName;
  setEngine1: Dispatch<SetStateAction<EngineName>>;
  depth1: number;
  setDepth1: Dispatch<SetStateAction<number>>;

  engine2: EngineName;
  setEngine2: Dispatch<SetStateAction<EngineName>>;
  depth2: number;
  setDepth2: Dispatch<SetStateAction<number>>;

  games: number;
  setGames: Dispatch<SetStateAction<number>>;
  startBattle: () => void;
};

export const Setting = ({
  engine1,
  setEngine1,
  depth1,
  setDepth1,
  engine2,
  setEngine2,
  depth2,
  setDepth2,
  games,
  setGames,
  startBattle,
}: SettingProps) => {
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
            value={games}
            onChange={(e) => setGames(Number(e.target.value))}
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

const MemoizedSetting = React.memo(Setting);
MemoizedSetting.displayName = "Setting";

export default MemoizedSetting;
