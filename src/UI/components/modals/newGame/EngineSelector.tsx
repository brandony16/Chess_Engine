import React from "react";
import { EngineTypes } from "../../../utilTypes.ts";

import EngineOption from "./EngineOption.jsx";

type EngineSelectorProps = {
  engine: string;
  onChange: (type: string) => void;
};

const engineOptions = Object.values(EngineTypes).reverse();

const EngineSelector = ({ engine, onChange }: EngineSelectorProps) => {
  return (
    <fieldset className="engine-selector">
      <legend>Choose your opponent</legend>
      <div className="engineWrap">
        {engineOptions.map((type) => (
          <EngineOption
            key={type}
            type={type}
            selected={engine === type}
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
