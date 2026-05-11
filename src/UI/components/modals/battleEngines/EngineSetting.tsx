import PropTypes from "prop-types";
import React, { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  engineNames,
  isEngineName,
  type EngineName,
} from "../../../../engines/bondmonkeyVersions/engineList.ts";

type EngineSettingProps = {
  engineValue: EngineName;
  depthValue: number;
  setEngine: Dispatch<SetStateAction<EngineName>>;
  setDepth: Dispatch<SetStateAction<number>>;
  id: string;
};
const EngineSettings = ({
  engineValue,
  depthValue,
  setEngine,
  setDepth,
  id,
}: EngineSettingProps) => {
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

      <div className="labelWrap">
        <label className="modalLabel" htmlFor={"depthSelect" + id}>
          Depth:
        </label>
        <input
          type="number"
          name="depth"
          step={1}
          className="numInput"
          max="10"
          min="1"
          value={depthValue}
          id={"depthSelect" + id}
          onChange={(e) => setDepth(Number(e.target.value))}
        />
      </div>
    </div>
  );
};

EngineSettings.propTypes = {
  engineValue: PropTypes.string.isRequired,
  depthValue: PropTypes.number.isRequired,
  setEngine: PropTypes.func.isRequired,
  setDepth: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
};

const MemoizedEngineSettings = React.memo(EngineSettings);
MemoizedEngineSettings.displayName = "EngineSettings";

export default MemoizedEngineSettings;
