import React from "react";

import EngineOption from "./EngineOption.jsx";
import { engines } from "../../../../engines/engineList.ts";

type EngineSelectorProps = {
  selected: string;
  onChange: (engine: string) => void;
};

const EngineSelector = ({ selected, onChange }: EngineSelectorProps) => {
  return (
    <fieldset className="engine-selector">
      <legend>Choose your opponent</legend>
      <div className="engineWrap">
        {engines.map((eng) => (
          <EngineOption
            key={eng}
            engine={eng}
            selected={selected === eng}
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
