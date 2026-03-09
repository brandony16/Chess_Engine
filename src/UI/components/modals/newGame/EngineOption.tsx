import React from "react";
import PropTypes from "prop-types";

import { EngineObjects, type Engine } from "../../../utilTypes.ts";

type EngineOptionProps = {
  type: Engine,
  selected: boolean,
  onSelect: (type: Engine) => void;
}

function EngineOption({ type, selected, onSelect }: EngineOptionProps) {
  const id = `engine-${type}`;
  return (
    <label
      htmlFor={id}
      className={`engineOption ${selected ? "selected" : ""}`}
    >
      <input
        id={id}
        type="radio"
        name="engine"
        value={type}
        checked={selected}
        onChange={() => onSelect(type)}
      />
      <span className="engineName">{EngineObjects[type].name}</span>
      <span className="engineDesc">{EngineObjects[type].description}</span>
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
