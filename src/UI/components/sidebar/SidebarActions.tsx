import { useGameStore } from "../../gameStore.ts";

import newGame from "../../../assets/new.svg";
import battle from "../../../assets/battle.svg";
import history from "../../../assets/history.svg";
import React from "react";

const SidebarActions = () => {
  const setSidebarMode = useGameStore((state) => state.setSidebarMode);

  return (
    <div className="iconBtnWrap">
      <button
        title="New game"
        className="newGame sidebarIconBtn"
        onClick={() => setSidebarMode("setup")}
      >
        <img className="sidebarIcon" src={newGame} alt="new game" />
      </button>
      <button
        title="Battle engines"
        className="engineBattle sidebarIconBtn"
        onClick={() => setSidebarMode("battle")}
      >
        <img className="sidebarIcon" src={battle} alt="battle engines" />
      </button>
      <button
        title="View previous games"
        className="prevGames sidebarIconBtn"
        onClick={() => setSidebarMode("history")}
      >
        <img className="sidebarIcon" src={history} alt="view past games" />
      </button>
    </div>
  );
};

const MemoizedActions = React.memo(SidebarActions);
MemoizedActions.displayName = "SidebarActions";

export default MemoizedActions;
