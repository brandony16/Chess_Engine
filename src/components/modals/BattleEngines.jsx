import "./BattleEngines.css";
import { useCallback, useMemo, useState } from "react";
import EngineSettings from "./battleEnginesComponents/engineSetting";
import { BattleModalStates, nameToType } from "../utilTypes";
import BattleWorker from "../bbEngines/battleEngineWorker.mjs?worker";
import FinalStats from "./battleEnginesComponents/FinalStats";
import { useGameStore } from "../gameStore.mjs";

const BattleEngines = () => {
  const [engine1, setEngine1] = useState("BondMonkeyV5");
  const [depth1, setDepth1] = useState(5);
  const [engine2, setEngine2] = useState("BondMonkeyV5");
  const [depth2, setDepth2] = useState(5);
  const [numGames, setNumGames] = useState(5);

  const [modalState, setModalState] = useState(BattleModalStates.SETTING);
  const [finalStats, setFinalStats] = useState(null);

  const { addHistoryEntry } = useGameStore.getState();

  const handleBattleMessage = useCallback((e) => {
    const data = e.data;
    if (data.type === "finished" || data.type === "done") {
      setFinalStats(data);
      setModalState(BattleModalStates.FINISHED);
    } else if (data.type === "progress") {
      // optionally track progress: data.gameNum, data.winRate, etc.
      console.log(
        `Game ${data.gameNum} — W:${data.wins}/D:${data.draws}/L:${data.losses}`
      );
    }
    if (data.gameHistoryEntry) {
      addHistoryEntry(data.gameHistoryEntry);
    }
  }, []);

  // Create the battle engines worker
  const battleWorker = useMemo(() => {
    const w = new BattleWorker();
    w.onmessage = (e) => handleBattleMessage(e);
    return w;
  }, [handleBattleMessage]);

  const startBattle = useCallback(() => {
    setModalState(BattleModalStates.LOADING);

    // serialize your inputs
    const engine1Type = nameToType[engine1];
    const engine2Type = nameToType[engine2];

    battleWorker.postMessage({
      engine1: engine1Type,
      eng1Depth: depth1,
      engine2: engine2Type,
      eng2Depth: depth2,
      games: numGames,
    });
  }, [battleWorker, engine1, depth1, engine2, depth2, numGames]);

  let content;
  switch (modalState) {
    case BattleModalStates.LOADING:
      content = <div className="loading">Running games… please wait.</div>;
      break;

    case BattleModalStates.FINISHED:
      content = (
        <FinalStats
          finalStats={finalStats}
          engine1={engine1}
          engine2={engine2}
          onReset={() => setModalState(BattleModalStates.SETTING)}
        />
      );
      break;

    case BattleModalStates.SETTING:
    default:
      content = (
        <>
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
        </>
      );
  }

  return (
    <div id="battleForm" className="battleEngines">
      {content}
    </div>
  );
};

export default BattleEngines;
