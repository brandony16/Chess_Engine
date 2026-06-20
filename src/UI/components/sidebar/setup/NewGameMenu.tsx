import { useCallback, useState } from "react";
import { useGameStore } from "../../../gameStore.ts";
import { START_POS } from "../../../../__tests__/game_tests/fens.ts";
import { BLACK, WHITE, type Player } from "../../../../game/chessConstants.ts";
import {
  type EngineName,
  engineNames,
} from "../../../../engines/bondmonkeyVersions/engineList.ts";
import {
  BLITZ_TCS,
  BULLET_TCS,
  msToMinutes,
  RAPID_TCS,
  type TimeControl,
} from "../../../timeControls.ts";

import wK from "../../../../assets/pieces/wK.svg";
import bK from "../../../../assets/pieces/bK.svg";
import random from "../../../../assets/random.svg";

import "./NewGameMenu.css";

export default function NewGameMenu() {
  const newGame = useGameStore((s) => s.newGame);

  const [opponent, setOpponent] = useState<EngineName>(engineNames[0]);
  const [userSide, setUserSide] = useState<Player | null>(null);
  const [clock, setClock] = useState<TimeControl>(
    useGameStore.getState().clockSettings,
  );

  const handleStart = useCallback(() => {
    let newSide = userSide;
    if (newSide === null) {
      newSide = Math.floor(Math.random() * 2) as Player;
    }

    console.log(clock, opponent, userSide);

    newGame({
      fen: START_POS,
      userSide: newSide,
      clockSettings: clock,
      selectedEngine: opponent,
    });
  }, [opponent, userSide, clock, newGame]);

  const isClockSelected = (tc: {
    timePerPlayer: number;
    increment: number;
  }) => {
    return (
      clock.timePerPlayer === tc.timePerPlayer &&
      clock.increment === tc.increment
    );
  };

  const timeControlCategories = [
    { label: "Bullet", options: BULLET_TCS },
    { label: "Blitz", options: BLITZ_TCS },
    { label: "Rapid", options: RAPID_TCS },
  ];

  return (
    <div className="new-game-menu">
      <h2 className="turnText">Match Setup</h2>

      <div className="setup-scroll-area">
        {/* Engine Selection */}
        <div className="option-group">
          <label className="group-label">Opponent Engine</label>
          <div className="selection-grid engine-grid">
            {engineNames.map((name) => {
              const version = name
                .slice("Bondmonkey".length)
                .replace("_", ".")
                .trim();
              const isActive = opponent === name;

              return (
                <button
                  key={name}
                  className={`grid-btn ${isActive ? "active" : ""}`}
                  onClick={() => setOpponent(name)}
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
            {timeControlCategories.map((category) => (
              <div key={category.label} className="tc-row">
                <div className="tc-row-label">{category.label}</div>
                <div className="selection-grid tc-grid">
                  {category.options.map((tc, i) => {
                    const mins = msToMinutes(tc.timePerPlayer);
                    const label =
                      tc.increment === 0
                        ? `${mins} min`
                        : `${mins} | ${Math.floor(tc.increment / 1000)}`;

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
            ))}
          </div>
        </div>

        {/* Side Selection */}
        <div className="option-group">
          <label className="group-label">Play As</label>
          <div className="selection-grid side-grid">
            <button
              className={`grid-btn icon-btn ${userSide === WHITE ? "active" : ""}`}
              onClick={() => setUserSide(WHITE)}
              title="Play White"
            >
              <img src={wK} alt="Play White" className="side-icon" />
            </button>

            <button
              className={`grid-btn icon-btn ${userSide === null ? "active" : ""}`}
              onClick={() => setUserSide(null)}
              title="Play Random"
            >
              <img src={random} alt="Play Random" className="side-icon" />
            </button>

            <button
              className={`grid-btn icon-btn ${userSide === BLACK ? "active" : ""}`}
              onClick={() => setUserSide(BLACK)}
              title="Play Black"
            >
              <img src={bK} alt="Play Black" className="side-icon" />
            </button>
          </div>
        </div>
      </div>

      <button className="start-game-btn" onClick={handleStart}>
        Start Game
      </button>
    </div>
  );
}
