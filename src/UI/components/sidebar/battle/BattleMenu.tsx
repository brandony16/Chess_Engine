import { useCallback, useEffect, useRef, useState } from "react";
import {
  type EngineName,
  engineNames,
} from "../../../../engines/bondmonkeyVersions/engineList.ts";
import { ENGINE_TCS, type TimeControl } from "../../../timeControls.ts";
import type {
  BattleWorkerMessage,
  BattleWorkerResponse,
} from "../../workers/battleEngineWorker.ts";
import { BattleModalStates } from "../../../utilTypes.ts";
import type { EngineConfig } from "../../../../engines/testing/matchWorker.ts";
import { MAX_SEARCH_PLY } from "../../../../engines/Engine.ts";
import { ContextType } from "../../../../engines/searchContext.ts";
import FinalStats from "./FinalStats.tsx";
import Loading from "./Loading.tsx";
import "./BattleEngines.css";

type ModalStates = (typeof BattleModalStates)[keyof typeof BattleModalStates];

export default function BattleMenu() {
  // ----- SETTINGS -----
  const [eng1, setEng1] = useState<EngineName>(engineNames[0]);
  const [eng2, setEng2] = useState<EngineName>(engineNames[1]);
  const [clock, setClock] = useState<TimeControl>(ENGINE_TCS[0]);
  const [numGames, setNumGames] = useState<number>(10);

  // ----- BATTLE PROGRESS -----
  const [gameBeingProcessed, setGameBeingProcessed] = useState<number>(1);
  const [modalState, setModalState] = useState<ModalStates>(
    BattleModalStates.SETTING,
  );
  const [finalStats, setFinalStats] = useState<BattleWorkerResponse>({
    type: "progress",
    games: 0,
    wins: -1,
    draws: -1,
    losses: -1,
    winRate: 0,
    score: 0,
  });

  // ----- WORKER LOGIC -----
  const workerRef = useRef<Worker>();

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

  const handleStart = useCallback(() => {
    setModalState(BattleModalStates.LOADING);

    const response: BattleWorkerMessage = {
      engine1Config: getConfig(eng1),
      engine2Config: getConfig(eng2),
      clockSettings: { type: ContextType.TIME_CONTROL, ...clock },
      games: numGames,
    };

    workerRef.current?.postMessage(response);
  }, [eng1, eng2, numGames, clock]);

  // ----- HELPERS -----
  const getConfig = (name: EngineName): EngineConfig => {
    return { version: name, depth: MAX_SEARCH_PLY };
  };

  const formatEngineTC = (tc: TimeControl) => {
    const seconds = (tc.timePerPlayer / 1000).toFixed(1);
    const inc = (tc.increment / 1000).toFixed(2);

    return `${seconds}s | ${inc}s`;
  };

  const isClockSelected = useCallback(
    (tc: TimeControl) => {
      return (
        clock.timePerPlayer === tc.timePerPlayer &&
        clock.increment === tc.increment
      );
    },
    [clock],
  );

  if (modalState === BattleModalStates.FINISHED) {
    return (
      <div className="new-game-menu">
        <FinalStats
          stats={finalStats}
          engine1={eng1}
          engine2={eng2}
          onReset={() => setModalState(BattleModalStates.SETTING)}
        />
      </div>
    );
  }

  if (modalState === BattleModalStates.LOADING) {
    return (
      <div className="new-game-menu">
        <Loading currGame={gameBeingProcessed} totalGames={numGames} />
      </div>
    );
  }

  return (
    <div className="new-game-menu">
      <h2 className="turnText">Match Setup</h2>

      <div className="setup-scroll-area">
        {/* Engine Selection */}
        <div className="option-group">
          <label className="group-label">Engine 1</label>
          <div className="selection-grid engine-grid">
            {engineNames.map((name) => {
              const version = name
                .slice("Bondmonkey".length)
                .replace("_", ".")
                .trim();
              const isActive = eng1 === name;

              return (
                <button
                  key={name}
                  className={`grid-btn ${isActive ? "active" : ""}`}
                  onClick={() => setEng1(name)}
                >
                  {version || "Latest"}
                </button>
              );
            })}
          </div>
        </div>
        <div className="option-group">
          <label className="group-label">Engine 2</label>
          <div className="selection-grid engine-grid">
            {engineNames.map((name) => {
              const version = name
                .slice("Bondmonkey".length)
                .replace("_", ".")
                .trim();
              const isActive = eng2 === name;

              return (
                <button
                  key={name}
                  className={`grid-btn ${isActive ? "active" : ""}`}
                  onClick={() => setEng2(name)}
                >
                  {version || "Latest"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Control */}
        <div className="option-group">
          <label className="group-label">Time Control</label>
          <div className="tc-categories">
            <div className="tc-row">
              <div className="tc-row-label">Engine Time Controls</div>
              <div className="selection-grid tc-grid">
                {ENGINE_TCS.map((tc, i) => {
                  const label = formatEngineTC(tc);

                  return (
                    <button
                      key={i}
                      className={`grid-btn ${isClockSelected(tc) ? "active" : ""}`}
                      onClick={() => setClock(tc)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="option-group">
          <label className="group-label">Number of Games</label>
          <div className="selection-grid tc-grid">
            {[10, 25, 50, 100, 250, 500].map((num) => (
              <button
                key={num}
                className={`grid-btn ${numGames === num ? "active" : ""}`}
                onClick={() => setNumGames(num)}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="start-game-btn" onClick={handleStart}>
        Start Battle
      </button>
    </div>
  );
}
