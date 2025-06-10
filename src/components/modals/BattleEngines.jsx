import "./BattleEngines.css";
import { useMemo, useState } from "react";
import EngineSettings from "./battleEnginesComponents/engineSetting";
import { nameToType } from "../utilTypes";
import BattleWorker from "../bbEngines/battleEngineWorker.mjs?worker";

const BattleEngines = () => {
  const [engine1, setEngine1] = useState("BondMonkeyV5");
  const [depth1, setDepth1] = useState(5);
  const [engine2, setEngine2] = useState("BondMonkeyV5");
  const [depth2, setDepth2] = useState(5);
  const [numGames, setNumGames] = useState(5);
  
  // Create the battle engines worker
  const battleWorker = useMemo(() => {
    const w = new BattleWorker();
    w.onmessage = (e) => {
      const data = e.data;
      handleBattleMessage(data);
    };
    return w;
  }, []);

  const handleBattleMessage = (data) => {
    const { type, gameNum, wins, draws, losses, winRate } = data;

    if (type === "progress") {
      console.log("Progress " + gameNum);
      return;
    }

    console.log("Done");
  };

  const startBattle = () => {
    if (!battleWorker) return;
    const engine1Type = nameToType[engine1];
    const engine2Type = nameToType[engine2];

    battleWorker.postMessage({
      engine1Type,
      depth1,
      engine2Type,
      depth2,
      numGames,
    });
  };
  return (
    <div id="battleForm" className="battleEngines">
      <div className="engineSettingsWrap">
        <EngineSettings
          engineValue={engine1}
          depthValue={depth1}
          setEngine={setEngine1}
          setDepth={setDepth1}
          id="one"
        />
        <EngineSettings
          engineValue={engine2}
          depthValue={depth2}
          setEngine={setEngine2}
          setDepth={setDepth2}
          id="two"
        />
      </div>

      <div className="paramWrap">
        <div className="labelWrap">
          <legend>Games:</legend>
          <input
            type="number"
            name="games"
            id="games"
            step="1"
            className="numInput"
            max="100"
            min="1"
            value={numGames}
            onChange={(e) => setNumGames(Number(e.target.value))}
          />
        </div>
      </div>

      <button
        className="battle"
        type="submit"
        id="battle"
        onClick={() => startBattle()}
      >
        Start
      </button>
    </div>
  );
};

export default BattleEngines;
