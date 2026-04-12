import React from "react";
import { getEngineDescription } from "../../../../engines/bondmonkeyVersions/engineList.ts";

type EngineOptionProps = {
  engine: string;
  selected: boolean;
  onSelect: (type: string) => void;
};

function EngineOption({ engine, selected, onSelect }: EngineOptionProps) {
  const id = `engine-${engine}`;
  return (
    <label
      htmlFor={id}
      className={`engineOption ${selected ? "selected" : ""}`}
    >
      <input
        id={id}
        type="radio"
        name="engine"
        value={engine}
        checked={selected}
        onChange={() => onSelect(engine)}
      />
      <span className="engineName">{engine}</span>
      <span className="engineDesc">{getEngineDescription(engine)}</span>
    </label>
  );
}

const MemoizedEngineOption = React.memo(EngineOption);
MemoizedEngineOption.displayName = "EngineOption";

export default MemoizedEngineOption;
