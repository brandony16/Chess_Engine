import React from "react";
import PropTypes from "prop-types";
import type { Engine } from "../../../../engines/Engine.ts";

type EngineOptionProps = {
  engine: Engine,
  selected: boolean,
  onSelect: (type: Engine) => void;
}

function EngineOption({ engine, selected, onSelect }: EngineOptionProps) {
  const id = `engine-${engine.name}`;
  return (
    <label
      htmlFor={id}
      className={`engineOption ${selected ? "selected" : ""}`}
    >
      <input
        id={id}
        type="radio"
        name="engine"
        value={engine.name}
        checked={selected}
        onChange={() => onSelect(engine)}
      />
      <span className="engineName">{engine.name}</span>
      <span className="engineDesc">{engine.description}</span>
    </label>
  );
}

EngineOption.propTypes = {
  type: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

const MemoizedEngineOption = React.memo(EngineOption);
MemoizedEngineOption.displayName = "EngineOption";

export default MemoizedEngineOption;
