import React, { useCallback, useEffect, useRef, useState } from "react";

import "./BattleEngines.css";
import { INITIAL_STATE } from "../../../gameStore.ts";
import { BattleModalStates } from "../../../utilTypes.ts";
import type { BattleWorkerResponse } from "../../workers/battleEngineWorker.ts";
import Loading from "./Loading.tsx";
import FinalStats from "./FinalStats.tsx";
import Setting from "./Setting.tsx";
import type { EngineName } from "../../../../engines/bondmonkeyVersions/engineList.ts";

type ModalStates = (typeof BattleModalStates)[keyof typeof BattleModalStates];

const BattleEngines = () => {
  // Engine States
  const [engine1, setEngine1] = useState<EngineName>(INITIAL_STATE.engine);
  const [engine2, setEngine2] = useState<EngineName>(INITIAL_STATE.engine);
  const [timeLimit, setTimeLimit] = useState<number>(INITIAL_STATE.timeLimit);

  // Game Settings
  const [numGames, setNumGames] = useState<number>(10);
  const [gameBeingProcessed, setGameBeingProcessed] = useState<number>(1);
  const [modalState, setModalState] = useState<ModalStates>(
    BattleModalStates.SETTING,
  );

  // Final Stats
  const [finalStats, setFinalStats] = useState<BattleWorkerResponse>({
    type: "progress",
    games: 0,
    wins: -1,
    draws: -1,
    losses: -1,
    winRate: 0,
    score: 0,
  });

  const workerRef = useRef<Worker>();

  // Handle messages from the worker
  const handleBattleMessage = useCallback(
    (e: { data: BattleWorkerResponse }) => {
      const data = e.data;
      if (data.type === "finished" || data.type === "done") {
        setFinalStats(data);
        setModalState(BattleModalStates.FINISHED);
        setGameBeingProcessed(1);
      } else if (data.type === "progress") {
        setGameBeingProcessed((prev) => prev + 1);
      }
    },
    [],
  );

  // Create the battle engines worker
  useEffect(() => {
    const BattleWorker = new URL(
      "../../workers/battleEngineWorker",
      import.meta.url,
    );
    const w = new Worker(BattleWorker, { type: "module" });

    w.onmessage = (e) => handleBattleMessage(e);

    workerRef.current = w;
    return () => w.terminate();
  }, [handleBattleMessage]);

  const startBattle = useCallback(() => {
    setModalState(BattleModalStates.LOADING);

    workerRef.current?.postMessage({
      engine1Name: engine1,
      engine2Name: engine2,
      timeLimit: timeLimit,
      games: numGames,
    });
  }, [workerRef, engine1, engine2, timeLimit, numGames]);

  let content;
  switch (modalState) {
    case BattleModalStates.LOADING:
      content = <Loading currGame={gameBeingProcessed} totalGames={numGames} />;
      break;

    case BattleModalStates.FINISHED:
      content = (
        <FinalStats
          stats={finalStats}
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
          engine2={engine2}
          setEngine2={setEngine2}
          timeLimit={timeLimit}
          setTimeLimit={setTimeLimit}
          games={numGames}
          setGames={setNumGames}
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
