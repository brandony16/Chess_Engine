import React, { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  engineNames,
  isEngineName,
  type EngineName,
} from "../../../../engines/bondmonkeyVersions/engineList.ts";

type EngineSettingProps = {
  engineValue: EngineName;
  setEngine: Dispatch<SetStateAction<EngineName>>;
  id: string;
};
const EngineSettings = ({ engineValue, setEngine, id }: EngineSettingProps) => {
  const updateValue = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;

      if (isEngineName(value)) {
        setEngine(value);
      }
    },
    [setEngine],
  );

  return (
    <div className="engineSettingPanel" id={id}>
      <div className="engine">
        <label className="modalLabel" htmlFor={"engSelect" + id}>
          Engine:
        </label>
        <select
          name="engine"
          className="modalSelect"
          value={engineValue}
          id={"engSelect" + id}
          onChange={updateValue}
        >
          {engineNames.map((name, index) => {
            return (
              <option key={index} value={name}>
                {name}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
};

const MemoizedEngineSettings = React.memo(EngineSettings);
MemoizedEngineSettings.displayName = "EngineSettings";

export default MemoizedEngineSettings;
