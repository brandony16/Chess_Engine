import React, { type Dispatch, type SetStateAction } from "react";

import EngineSettings from "./EngineSetting.tsx";
import type { EngineName } from "../../../../engines/bondmonkeyVersions/engineList.ts";

type SettingProps = {
  engine1: EngineName;
  setEngine1: Dispatch<SetStateAction<EngineName>>;

  engine2: EngineName;
  setEngine2: Dispatch<SetStateAction<EngineName>>;

  games: number;
  setGames: Dispatch<SetStateAction<number>>;
  startBattle: () => void;
};

export const Setting = ({
  engine1,
  setEngine1,
  engine2,
  setEngine2,
  games,
  setGames,
  startBattle,
}: SettingProps) => {
  return (
    <>
      <div className="engineSettingsWrap">
        <EngineSettings engineValue={engine1} setEngine={setEngine1} id="one" />
        <EngineSettings engineValue={engine2} setEngine={setEngine2} id="two" />
      </div>

      <div className="paramWrap">
        <div className="labelWrap">
          <legend>Time (ms):</legend>
          <input
            type="number"
            name="games"
            id="games"
            step="10"
            className="numInput"
            max="10000"
            min="50"
            value={0}
          />
        </div>
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
