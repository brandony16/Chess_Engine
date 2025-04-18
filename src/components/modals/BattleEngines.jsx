import PropTypes from "prop-types";
import { BMV1 } from "../bbEngines/BondMonkeyV1";
import { BMV2 } from "../bbEngines/BondMonkeyV2";
import "./BattleEngines.css";

const BattleEngines = ({ battleEngines }) => {
  const engines = ["BondMonkeyV1", "BondMonkeyV2"];
  const nameToEngine = {
    BondMonkeyV1: BMV1,
    BondMonkeyV2: BMV2,
  };

  const startBattle = (e) => {
    e.preventDefault();

    const form = document.getElementById("battleForm");
    const data = new FormData(form);
    const engine1 = data.get("engine1");
    const engine1Func = nameToEngine[engine1];
    const engine2 = data.get("engine2");
    const engine2Func = nameToEngine[engine2];
    const depth = data.get("depth");
    const numGames = data.get("games");

    battleEngines(engine1Func, engine2Func, numGames, depth);
  };

  return (
    <form id="battleForm" className="battleEngines">
      <div className="engineWrapper">
        <div className="engine">
          <label htmlFor="engine1" className="modalSubheader">
            Engine 1:
          </label>
          <select name="engine1" className="modalSelect">
            {engines.map((name, index) => {
              return (
                <option key={index} value={name}>
                  {name}
                </option>
              );
            })}
          </select>
        </div>
        <div className="engine">
          <label htmlFor="engine2" className="modalSubheader">
            Engine 2:
          </label>
          <select name="engine2" className="modalSelect">
            {engines.map((name, index) => {
              return (
                <option key={index} value={name} className="option">
                  {name}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="paramWrap">
        <div className="labelWrap">
          <label htmlFor="depth">Depth:</label>
          <input
            type="number"
            name="depth"
            step={1}
            defaultValue={3}
            className="numInput"
            max="10"
            min="1"
          />
        </div>
        <div className="labelWrap">
          <label htmlFor="games">Games:</label>
          <input
            type="number"
            name="games"
            step="1"
            defaultValue="5"
            className="numInput"
            max="100"
            min="1"
          />
        </div>
      </div>

      <button
        className="battle"
        type="submit"
        id="battle"
        onClick={(e) => startBattle(e)}
      >
        Start
      </button>
    </form>
  );
};

BattleEngines.propTypes = {
  battleEngines: PropTypes.func.isRequired,
};

export default BattleEngines;
