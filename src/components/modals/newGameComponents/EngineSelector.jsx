import PropTypes from "prop-types";
import { EngineTypes } from "../../utilTypes";

const EngineSelector = ({ engine, onChange }) => {
  const engineTitles = {
    BMV1: "BondMonkey V1",
    BMV2: "BondMonkey V2",
    BMV3: "BondMonkey V3",
    BMV4: "BondMonkey V4",
    BMV5: "BondMonkey V5",
  }

  const engineDescriptions = {
    BMV1: "Plays random moves",
    BMV2: "Plays random moves",
    BMV3: "Plays random moves",
    BMV4: "Plays random moves",
    BMV5: "Plays random moves",
  }
  
  return (
  <fieldset className="engine-selector">
    <legend>Choose your opponent</legend>
      {Object.values(EngineTypes).map((type) => (
        <label key={type} className={`option ${engine === type ? "selected" : ""}`}>
          <input
            type="radio"
            name="engine"
            value={type}
            checked={engine === type}
            onChange={() => onChange(type)}
          />
          <span className="engineName">{engineTitles[type]}</span>
          <span className="engineDesc">{engineDescriptions[type]}</span>
        </label>
      ))}
  </fieldset>
)};

EngineSelector.propTypes = {
  engine: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default EngineSelector;
