import { useCallback, useEffect, useState } from "react";
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

export default function NewGameMenu() {
  const newGame = useGameStore((s) => s.newGame);
  const [opponent, setOpponent] = useState<EngineName>(engineNames[0]);
  const [userSide, setUserSide] = useState<Player | null>(null);
  const [clock, setClock] = useState<{
    timePerPlayer: number;
    increment: number;
  }>(useGameStore.getState().clockSettings);

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
  }, [opponent, userSide, clock]);

  return (
    <div className="new-game-menu">
      <h2 className="turnText">Match Setup</h2>

      <div className="setup-options">
        {/* Engine Selection */}
        <div className="option-group">
          <label>Opponent</label>
          <div className="engine-select">
            {engineNames.map((name, i) => {
              const version = name
                .slice("Bondmonkey".length)
                .replace("_", ".")
                .trim();
              return (
                <button
                  key={i}
                  className="version-option"
                  onClick={() => setOpponent(name)}
                >
                  {version}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Control */}
        <div className="option-group">
          <label>Time Control</label>
          <div className="time-buttons">
            <div>Bullet</div>
            {BULLET_TCS.map((tc: TimeControl, i) => {
              const mins = msToMinutes(tc.timePerPlayer);
              if (tc.increment === 0) {
                return (
                  <button
                    key={i}
                    className="tc-option"
                    onClick={() => setClock(tc)}
                  >
                    {mins} mins
                  </button>
                );
              }

              return (
                <button
                  key={i}
                  className="tc-option"
                  onClick={() => setClock(tc)}
                >{`${mins} | ${Math.floor(tc.increment / 1000)}`}</button>
              );
            })}
          </div>
          <div className="time-buttons">
            <div>Blitz</div>
            {BLITZ_TCS.map((tc: TimeControl, i) => {
              const mins = msToMinutes(tc.timePerPlayer);
              if (tc.increment === 0) {
                return (
                  <button
                    key={i}
                    className="tc-option"
                    onClick={() => setClock(tc)}
                  >
                    {mins} mins
                  </button>
                );
              }

              return (
                <button
                  key={i}
                  className="tc-option"
                  onClick={() => setClock(tc)}
                >{`${mins} | ${Math.floor(tc.increment / 1000)}`}</button>
              );
            })}
          </div>
          <div className="time-buttons">
            <div>Rapid</div>
            {RAPID_TCS.map((tc: TimeControl, i) => {
              const mins = msToMinutes(tc.timePerPlayer);
              if (tc.increment === 0) {
                return (
                  <button
                    key={i}
                    className="tc-option"
                    onClick={() => setClock(tc)}
                  >
                    {mins} mins
                  </button>
                );
              }

              return (
                <button
                  key={i}
                  className="tc-option"
                  onClick={() => setClock(tc)}
                >{`${mins} | ${Math.floor(tc.increment / 1000)}`}</button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="start-actions">
        <div>Side</div>
        <button
          onClick={() => setUserSide(WHITE)}
          className="play-btn white-btn"
        >
          Play White
        </button>
        <button
          onClick={() => setUserSide(null)}
          className="play-btn random-btn"
        >
          Play Random
        </button>
        <button
          onClick={() => setUserSide(BLACK)}
          className="play-btn black-btn"
        >
          Play Black
        </button>
      </div>

      <button className="newGame" onClick={() => handleStart()}>
        Start Game
      </button>
    </div>
  );
}
