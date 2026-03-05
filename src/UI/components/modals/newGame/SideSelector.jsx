import PropTypes from "prop-types";

import wK from "../../../assets/pieces/wK.svg";
import bK from "../../../assets/pieces/bK.svg";
import random from "../../../assets/random.svg";
import React from "react";

const SideSelector = ({ value, onChange }) => (
  <fieldset className="side-selector">
    <legend className="sideLegend">Choose your side</legend>

    <label className={`option ${value === "W" ? "selected" : ""}`}>
      <input
        type="radio"
        name="side"
        value="W"
        checked={value === "W"}
        onChange={() => onChange("W")}
      />
      <img src={wK} alt="white" className="newGameIcon" />
    </label>

    <label className={`option ${value === "R" ? "selected" : ""}`}>
      <input
        type="radio"
        name="side"
        value="R"
        checked={value === "R"}
        onChange={() => onChange("R")}
      />
      <img src={random} alt="random" className="newGameIcon" />
    </label>

    <label className={`option ${value === "B" ? "selected" : ""}`}>
      <input
        type="radio"
        name="side"
        value="B"
        checked={value === "B"}
        onChange={() => onChange("B")}
      />
      <img src={bK} alt="black" className="newGameIcon" />
    </label>
  </fieldset>
);

SideSelector.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const MemoizedSideSelector = React.memo(SideSelector);
MemoizedSideSelector.displayName = "SideSelector";

export default MemoizedSideSelector;
