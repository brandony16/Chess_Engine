import React from "react";

import EngineOption from "./EngineOption.jsx";
import { engineNames } from "../../../../engines/bondmonkeyVersions/engineList.ts";

type EngineSelectorProps = {
  selected: string;
  onChange: (engine: string) => void;
};

const EngineSelector = ({ selected, onChange }: EngineSelectorProps) => {
  return (
    <fieldset className="engine-selector">
      <legend>Choose your opponent</legend>
      <div className="engineWrap">
        {engineNames.map((name) => (
          <EngineOption
            key={name}
            engine={name}
            selected={selected === name}
            onSelect={onChange}
          />
        ))}
      </div>
    </fieldset>
  );
};

const MemoizedEngineSelector = React.memo(EngineSelector);
MemoizedEngineSelector.displayName = "EngineSelector";

export default MemoizedEngineSelector;
