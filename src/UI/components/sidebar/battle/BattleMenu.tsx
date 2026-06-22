import { useCallback, useState } from "react";
import {
  type EngineName,
  engineNames,
} from "../../../../engines/bondmonkeyVersions/engineList.ts";
import { ENGINE_TCS, type TimeControl } from "../../../timeControls.ts";
import { useGameStore } from "../../../gameStore.ts";

export default function BattleMenu() {
  const [eng1, setEng1] = useState<EngineName>(engineNames[0]);
  const [eng2, setEng2] = useState<EngineName>(engineNames[1]);
  const [clock, setClock] = useState<TimeControl>(ENGINE_TCS[0]);

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

  const handleStart = useCallback(() => {}, [eng1, eng2, clock]);

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
      </div>

      <button className="start-game-btn" onClick={handleStart}>
        Start Battle
      </button>
    </div>
  );
}
