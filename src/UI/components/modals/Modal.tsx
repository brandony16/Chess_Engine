import GameHistory from "./gameHistory/GameHistory.jsx";
import { useGameStore, type ModalType } from "../../gameStore.ts";
import "./Modal.css";
import BattleEngines from "./battleEngines/BattleEngines.jsx";
import NewGame from "./newGame/NewGame.jsx";
import { ModalTypes } from "../../utilTypes.ts";

const MODAL_TITLES = {
  history: "Past Games:",
  battle: "Engine Battle:",
  new: "New Game:",
};

const Modal = () => {
  const modalState = useGameStore((state) => state.modalState);
  const closeModal = useGameStore((state) => state.closeModal);

  const renderModalContent = (type: ModalType) => {
    switch (type) {
      case ModalTypes.HISTORY:
        return <GameHistory />;
      case ModalTypes.BATTLE:
        return <BattleEngines />;
      case ModalTypes.NEW:
        return <NewGame />;
      default:
        return null;
    }
  };

  return (
    <div className="modalWrap">
      {modalState.isOpen && (
        <div className="modalBody">
          <button className="close" onClick={closeModal}>
            X
          </button>
          <h1 className="modalHeader">{MODAL_TITLES[modalState.type]}</h1>
          {renderModalContent(modalState.type)}
        </div>
      )}
    </div>
  );
};

export default Modal;
