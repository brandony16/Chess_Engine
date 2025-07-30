import { useGameStore } from "../gameStore.mjs";
import { ModalTypes } from "../utilTypes";

import newGame from "../../assets/new.svg";
import battle from "../../assets/battle.svg";
import history from "../../assets/history.svg";
import flipBoard from "../../assets/flip.svg";
import React from "react";

const SidebarActions = () => {
  const openModal = useGameStore((state) => state.openModal);
  const flipBoardView = useGameStore((state) => state.flipBoardView);

  return (
    <div className="iconBtnWrap">
      <button
        title="New game"
        className="newGame sidebarIconBtn"
        onClick={() => openModal(ModalTypes.NEW)}
      >
        <img className="sidebarIcon" src={newGame} alt="new game" />
      </button>
      <button
        title="Battle engines"
        className="engineBattle sidebarIconBtn"
        onClick={() => openModal(ModalTypes.BATTLE)}
      >
        <img className="sidebarIcon" src={battle} alt="battle engines" />
      </button>
      <button
        title="View previous games"
        className="prevGames sidebarIconBtn"
        onClick={() => openModal(ModalTypes.HISTORY)}
      >
        <img className="sidebarIcon" src={history} alt="view past games" />
      </button>
      <button
        title="Flip board orientation"
        className="flipBoard sidebarIconBtn"
        onClick={() => flipBoardView()}
      >
        <img className="sidebarIcon" src={flipBoard} alt="flip board" />
      </button>
    </div>
  );
};

const MemoizedActions = React.memo(SidebarActions);
MemoizedActions.displayName = "SidebarActions";

export default MemoizedActions;
