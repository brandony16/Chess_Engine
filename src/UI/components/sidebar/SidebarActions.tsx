import { useGameStore } from "../../gameStore.ts";

import newGame from "../../../assets/new.svg";
import battle from "../../../assets/battle.svg";
import history from "../../../assets/history.svg";
import flipBoardImg from "../../../assets/flip.svg";
import React, { useCallback } from "react";
import { ModalTypes } from "../../utilTypes.ts";

const SidebarActions = () => {
  const openModal = useGameStore((state) => state.openModal);
  const flipBoard = useGameStore((state) => state.flipBoard);
  const setSidebarMode = useGameStore((state) => state.setSidebarMode);

  const openBattle = useCallback(
    () => openModal(ModalTypes.BATTLE),
    [openModal],
  );
  const openHistory = useCallback(
    () => openModal(ModalTypes.HISTORY),
    [openModal],
  );

  return (
    <div className="iconBtnWrap">
      <button
        title="New game"
        className="newGame sidebarIconBtn"
        onClick={() => setSidebarMode("playing")}
      >
        <img className="sidebarIcon" src={newGame} alt="new game" />
      </button>
      <button
        title="Battle engines"
        className="engineBattle sidebarIconBtn"
        onClick={openBattle}
      >
        <img className="sidebarIcon" src={battle} alt="battle engines" />
      </button>
      <button
        title="View previous games"
        className="prevGames sidebarIconBtn"
        onClick={openHistory}
      >
        <img className="sidebarIcon" src={history} alt="view past games" />
      </button>
      <button
        title="Flip board orientation"
        className="flipBoard sidebarIconBtn"
        onClick={flipBoard}
      >
        <img className="sidebarIcon" src={flipBoardImg} alt="flip board" />
      </button>
    </div>
  );
};

const MemoizedActions = React.memo(SidebarActions);
MemoizedActions.displayName = "SidebarActions";

export default MemoizedActions;
