import { useState } from "react";
import { EngineTypes } from "../utilTypes";
import { useGameStore } from "../gameStore.mjs";
import { BLACK, WHITE } from "../../Core Logic/constants.mjs";
import SideSelector from "./newGameComponents/SideSelector";
import "./NewGame.css";
import EngineSelector from "./newGameComponents/EngineSelector";

const NewGame = () => {
  const resetGame = useGameStore((s) => s.resetGame);
  const closeModal = useGameStore((s) => s.closeModal);

  const [userSide, setUserSide] = useState("W");
  const [engine, setEngineLocal] = useState(EngineTypes.BMV5);
  const [depth, setDepth] = useState(4);
  const [timeLimit, setTimeLimit] = useState(5000);

  const handleStart = () => {
    resetGame({
      isEngineGame: false,
      userSide: getSide(),
      engine: engine,
      depth: depth,
      timeLimitMs: timeLimit,
    });
  };
  const getSide = () => {
    if (userSide[0] === "W") {
      return WHITE;
    }
    if (userSide[0] === "B") {
      return BLACK;
    }
    return Math.floor(Math.random() * 2);
  };

  return (
    <div className="newGameBody">
      <EngineSelector engine={engine} onChange={setEngineLocal} />

      <div className="depthTimeWrap">
        <div className="form-group">
          <label htmlFor="depth-input">Search Depth:</label>
          <input
            id="depth-input"
            type="number"
            min="1"
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
          />
          {depth >= 8 && (
            <p className="depthWarning">
              Warning: High depths may cause long engine thinking time!
            </p>
          )}
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
      </div>

      <div className="bottomRowWrap">
        <SideSelector value={userSide} onChange={setUserSide} />
        <div className="modal-actions">
          <button onClick={closeModal} className="btn cancel">
            Cancel
          </button>
          <button onClick={handleStart} className="btn primary">
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewGame;
