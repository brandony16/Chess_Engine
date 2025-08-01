import GameHistory from "./gameHistory/GameHistory";
import { useGameStore } from "../gameStore.mjs";
import "./Modal.css";
import BattleEngines from "./battleEngines/BattleEngines";
import NewGame from "./newGame/NewGame";
import React from "react";

const MODAL_TITLES = {
  history: "Past Games:",
  battle: "Engine Battle:",
  new: "New Game:",
};

const Modal = () => {
  const modalType = useGameStore((state) => state.modalType);
  const closeModal = useGameStore((state) => state.closeModal);

  const renderModalContent = () => {
    switch (modalType) {
      case "history":
        return <GameHistory />;
      case "battle":
        return <BattleEngines />;
      case "new":
        return <NewGame />;
      default:
        return null;
    }
  };

  return (
    <div className="modalWrap">
      <div className="modalBody">
        <button className="close" onClick={closeModal}>
          X
        </button>
        <h1 className="modalHeader">{MODAL_TITLES[modalType]}</h1>
        {renderModalContent()}
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
const MemoizedModal = React.memo(Modal);
MemoizedModal.displayName = "Modal";

export default MemoizedModal;
