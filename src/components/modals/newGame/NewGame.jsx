import { useCallback, useReducer } from "react";

import { EngineTypes } from "../../utilTypes";
import { useGameStore } from "../../gameStore.mjs";
import { BLACK, WHITE } from "../../../coreLogic/constants.mjs";

import SideSelector from "./SideSelector";
import EngineSelector from "./EngineSelector";

import "./NewGame.css";

const initialState = {
  userSide: "W",
  engine: EngineTypes.BMV7,
  depth: 5,
  timeLimit: 5000,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

const NewGame = () => {
  const resetGame = useGameStore((s) => s.resetGame);
  const closeModal = useGameStore((s) => s.closeModal);

  const [state, dispatch] = useReducer(reducer, initialState);
  const { userSide, engine, depth, timeLimit } = state;

  const onEngineChange = useCallback(
    (newEngine) =>
      dispatch({ type: "SET_FIELD", field: "engine", value: newEngine }),
    []
  );

  const onSideChange = useCallback(
    (newSide) =>
      dispatch({ type: "SET_FIELD", field: "userSide", value: newSide }),
    []
  );

  const getSide = useCallback(() => {
    if (userSide[0] === "W") return WHITE;

    if (userSide[0] === "B") return BLACK;

    return Math.floor(Math.random() * 2);
  }, [userSide]);

  const handleStart = useCallback(() => {
    resetGame({
      isEngineGame: false,
      userSide: getSide(),
      engine: engine,
      depth: depth,
      timeLimitMs: timeLimit,
    });
  }, [resetGame, getSide, engine, depth, timeLimit]);

  return (
    <div className="newGameBody">
      <EngineSelector engine={engine} onChange={onEngineChange} />

      <div className="depthTimeWrap">
        <div className="form-group">
          <label htmlFor="depth-input">Search Depth:</label>
          <input
            id="depth-input"
            type="number"
            min="1"
            value={depth}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                field: "depth",
                value: Number(e.target.value),
              })
            }
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
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                field: "timeLimit",
                value: Number(e.target.value),
              })
            }
          />
        </div>
      </div>

      <div className="bottomRowWrap">
        <SideSelector value={userSide} onChange={onSideChange} />
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
