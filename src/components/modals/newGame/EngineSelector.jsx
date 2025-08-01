import PropTypes from "prop-types";
import React from "react";

import { EngineTypes } from "../../utilTypes";

import EngineOption from "./EngineOption";

const engineOptions = Object.values(EngineTypes).reverse();

const EngineSelector = ({ engine, onChange }) => {
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

EngineSelector.propTypes = {
  engine: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const MemoizedEngineSelector = React.memo(EngineSelector);
MemoizedEngineSelector.displayName = "EngineSelector";

export default MemoizedEngineSelector;
