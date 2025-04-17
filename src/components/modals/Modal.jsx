import PropTypes from "prop-types";
import GameHistoryModal from "./GameHistoryModal";
import { useGameStore } from "../gameStore";
import "./Modal.css";
import BattleEngines from "./battleEngines";

const Modal = ({ isGameHistory, isBattle, battleEngines }) => {
  const closeModal = useGameStore((state) => state.closeModal);

  return (
    <div className="modalWrap">
      <div className="modalBody">
        <button className="close" onClick={() => closeModal()}>
          X
        </button>
        <h1 className="modalHeader">
          {isGameHistory && "Past Games:"}
          {isBattle && "Engine Battle:"}
        </h1>
        {isGameHistory && <GameHistoryModal />}
        {isBattle && <BattleEngines battleEngines={battleEngines} />}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isGameHistory: PropTypes.bool.isRequired,
  isBattle: PropTypes.bool.isRequired,
  battleEngines: PropTypes.func.isRequired,
};

export default Modal;
