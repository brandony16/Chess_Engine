import React, { useCallback, useEffect, useRef, useState } from "react";

import { BattleModalStates, nameToType } from "../../utilTypes";
import BattleWorker from "../../bbEngines/battleEngineWorker.mjs?worker";
import { useGameStore } from "../../gameStore.mjs";

import Setting from "./Setting";
import Loading from "./Loading";
import FinalStats from "./FinalStats";

import "./BattleEngines.css";

const BattleEngines = () => {
  // Engine States
  const [engine1, setEngine1] = useState("BondMonkeyV5");
  const [depth1, setDepth1] = useState(5);
  const [engine2, setEngine2] = useState("BondMonkeyV5");
  const [depth2, setDepth2] = useState(5);

  // Game Settings
  const [numGames, setNumGames] = useState(5);
  const [gameBeingProcessed, setGameBeingProcessed] = useState(1);
  const [modalState, setModalState] = useState(BattleModalStates.SETTING);

  // Final Stats
  const [finalStats, setFinalStats] = useState({
    type: null,
    gameNum: 0,
    wins: -1,
    draws: -1,
    losses: -1,
    winRate: 0,
    gameHistoryEntry: null,
  });

  const { addHistoryEntry } = useGameStore.getState();

  const workerRef = useRef();

  // Handle messages from the worker
  const handleBattleMessage = useCallback(
    (e) => {
      const data = e.data;
      if (data.type === "finished" || data.type === "done") {
        setFinalStats(data);
        setModalState(BattleModalStates.FINISHED);
        setGameBeingProcessed(1);
      } else if (data.type === "progress") {
        setGameBeingProcessed((prev) => prev + 1);
      }
      if (data.gameHistoryEntry) {
        addHistoryEntry(data.gameHistoryEntry);
      }
    },
    [addHistoryEntry]
  );

  // Create the battle engines worker
  useEffect(() => {
    const w = new BattleWorker();
    w.onmessage = (e) => handleBattleMessage(e);

    workerRef.current = w;
    return () => w.terminate();
  }, [handleBattleMessage]);

  const startBattle = useCallback(() => {
    setModalState(BattleModalStates.LOADING);

    const engine1Type = nameToType[engine1];
    const engine2Type = nameToType[engine2];

    workerRef.current?.postMessage({
      engine1: engine1Type,
      eng1Depth: depth1,
      engine2: engine2Type,
      eng2Depth: depth2,
      games: numGames,
    });
  }, [workerRef, engine1, depth1, engine2, depth2, numGames]);

  let content;
  switch (modalState) {
    case BattleModalStates.LOADING:
      content = <Loading gameNum={gameBeingProcessed} totalGames={numGames} />;
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
        <Setting
          engine1={engine1}
          setEngine1={setEngine1}
          depth1={depth1}
          setDepth1={setDepth1}
          engine2={engine2}
          setEngine2={setEngine2}
          depth2={depth2}
          setDepth2={setDepth2}
          numGames={numGames}
          setNumGames={setNumGames}
          startBattle={startBattle}
        />
      );
  }

  return (
    <div id="battleForm" className="battleEngines">
      {content}
    </div>
  );
};

const MemoizedBattleEngines = React.memo(BattleEngines);
MemoizedBattleEngines.displayName = "BattleEngines";

export default MemoizedBattleEngines;
