import { useEffect, useState } from "react";
import { useGameStore } from "./gameStore.ts";
import "./gameClock.css";
import { BLACK, WHITE } from "../game/chessConstants.ts";

const LOW_TIME_THRESHOLD_MS = 10000; // 10 seconds

export default function GameClock() {
  const fen = useGameStore((s) => s.fen);
  const whiteTime = useGameStore((s) => s.whiteTimeMs);
  const blackTime = useGameStore((s) => s.blackTimeMs);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const increment = useGameStore((s) => s.clockSettings.increment);

  const [whiteDisplayTime, setWhiteDisplayTime] = useState(whiteTime);
  const [blackDisplayTime, setBlackDisplayTime] = useState(blackTime);

  const activeColor = fen.split(" ")[1];
  const isWhiteActive = activeColor === "w";
  const isBlackActive = activeColor === "b";

  useEffect(() => {
    if (isGameOver()) return;

    const side = fen.split(" ")[1];
    const initialTime = side === "w" ? whiteTime : blackTime;

    const startTimestamp = Date.now();

    setWhiteDisplayTime(whiteTime);
    setBlackDisplayTime(blackTime);

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTimestamp;
      const timeLeft = Math.max(0, initialTime - elapsed);

      if (side === "w") setWhiteDisplayTime(timeLeft);
      else setBlackDisplayTime(timeLeft);

      if (timeLeft === 0) {
        clearInterval(interval);
        // Fire the timeout action directly to the store
        useGameStore.getState().handleTimeOut(isWhiteActive ? WHITE : BLACK);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [fen, whiteTime, blackTime]);

  return (
    <div className="game-clocks">
      {/* Black Player Clock */}
      <div
        className={`clock-card ${isBlackActive ? "active" : ""} ${
          blackDisplayTime <= LOW_TIME_THRESHOLD_MS ? "low-time" : ""
        }`}
      >
        <h3 className="clock-title">Black</h3>
        <h4 className="clock-time">{formatTime(blackDisplayTime)}</h4>
      </div>

      {/* White Player Clock */}
      <div
        className={`clock-card ${isWhiteActive ? "active" : ""} ${
          whiteDisplayTime <= LOW_TIME_THRESHOLD_MS ? "low-time" : ""
        }`}
      >
        <h3 className="clock-title">White</h3>
        <h4 className="clock-time">{formatTime(whiteDisplayTime)}</h4>
      </div>
    </div>
  );
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, ms) / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((ms % 1000) / 100);

  const secString = seconds.toString().padStart(2, "0");

  // Only show tenths of a second if under 1 minute
  if (minutes === 0) {
    return `${secString}.${tenths}`;
  }
  return `${minutes}:${secString}`;
}
