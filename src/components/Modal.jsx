import GameHistoryModal from "./GameHistoryModal";
import { useGameStore } from "./gameStore";
import "./Modal.css";

const Modal = ({ isGameHistory }) => {
  const closeModal = () => {
    useGameStore.setState({ isModalOpen: false, isGameHistoryMenuOpen: false });
  };

  return (
    <div className="modalWrap">
      <div className="modalBody">
        <button className="close" onClick={() => closeModal()}>
          X
        </button>
        <h1 className="modalHeader">
          {isGameHistory && "Past Games:"}
        </h1>
        {isGameHistory && <GameHistoryModal />}
      </div>
    </div>
  );
};

export default Modal;
