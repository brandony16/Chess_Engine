import PropTypes from "prop-types";
import GameHistoryModal from "./GameHistoryModal";
import { useGameStore } from "../gameStore.mjs";
import "./Modal.css";
import BattleEngines from "./BattleEngines";
import NewGame from "./NewGame";

const Modal = ({ battleEngines }) => {
  const { modalType, closeModal } = useGameStore.getState();

  const MODAL_TITLES = {
    history: "Past Games:",
    battle: "Engine Battle:",
    new: "New Game:",
  };

  const renderModalContent = () => {
    switch (modalType) {
      case "history":
        return <GameHistoryModal />;
      case "battle":
        return <BattleEngines battleEngines={battleEngines} />;
      case "new":
        return <NewGame />;
      default:
        return null;
    }
  };

  return (
    <div className="modalWrap">
      <div className="modalBody">
        <button className="close" onClick={() => closeModal()}>
          X
        </button>
        <h1 className="modalHeader">{MODAL_TITLES[modalType]}</h1>
        {renderModalContent()}
      </div>
    </div>
  );
};

Modal.propTypes = {
  battleEngines: PropTypes.func.isRequired,
};

export default Modal;
