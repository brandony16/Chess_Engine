import PropTypes from "prop-types";

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
      <img src="./images/wK.svg" alt="white" className="newGameIcon" />
    </label>

    <label className={`option ${value === "R" ? "selected" : ""}`} >
      <input
        type="radio"
        name="side"
        value="R"
        checked={value === "R"}
        onChange={() => onChange("R")}
      />
      <img src="./images/random.svg" alt="random" className="newGameIcon" />
    </label>

    <label className={`option ${value === "B" ? "selected" : ""}`}>
      <input
        type="radio"
        name="side"
        value="B"
        checked={value === "B"}
        onChange={() => onChange("B")}
      />
      <img src="./images/bK.svg" alt="black" className="newGameIcon" />
    </label>
  </fieldset>
);

SideSelector.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default SideSelector;
