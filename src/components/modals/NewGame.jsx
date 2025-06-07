import { useState } from "react";
import { EngineTypes } from "../utilTypes";
import { useGameStore } from "../gameStore.mjs";
import { BLACK, WHITE } from "../bitboardUtils/constants.mjs";

const NewGame = () => {
  const resetGame = useGameStore((s) => s.resetGame);
  const closeModal = useGameStore((s) => s.closeModal);

  const [userSide, setUserSide] = useState(WHITE);
  const [engine, setEngineLocal] = useState(EngineTypes.BMV5);
  const [depth, setDepth] = useState(4);
  const [timeLimit, setTimeLimit] = useState(5000);

  const handleStart = () => {
    resetGame({
      isEngineGame: false,
      userSide: parseInt(userSide),
      engine: engine,
      depth: depth,
      timeLimitMs: timeLimit,
    });
  };

  return (
    <div className="newGameBody">
      <div className="form-group">
        <label htmlFor="player-select">Side to play:</label>
        <select
          id="player-select"
          value={userSide}
          onChange={(e) => setUserSide(e.target.value)}
        >
            <option value={WHITE}>
              White
            </option>
            <option value={BLACK}>
              Black
            </option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="engine-select">Engine:</label>
        <select
          id="engine-select"
          value={engine}
          onChange={(e) => setEngineLocal(e.target.value)}
        >
          {Object.values(EngineTypes).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="depth-input">Search Depth:</label>
        <input
          id="depth-input"
          type="number"
          min="1"
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
        />
      </div>

      <div className="form-group">
        <label htmlFor="time-input">Time Limit (ms):</label>
        <input
          id="time-input"
          type="number"
          min="100"
          step="100"
          value={timeLimit}
          onChange={(e) => setTimeLimit(Number(e.target.value))}
        />
      </div>

      <div className="modal-actions">
        <button onClick={closeModal} className="btn cancel">
          Cancel
        </button>
        <button onClick={handleStart} className="btn primary">
          Start Game
        </button>
      </div>
    </div>
  );
};

export default NewGame;
