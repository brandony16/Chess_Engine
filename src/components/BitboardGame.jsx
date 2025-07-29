import PromotionModal from "./modals/PromotionModal";
import Sidebar from "./sidebar/Sidebar";
import "./UI.css";
import BitboardBoard from "./boardComponents/BitboardBoard";
import { useGameStore } from "./gameStore.mjs";
import Modal from "./modals/Modal";
import useEngineWorker from "./hooks/useEngineWorker";
import useChessActions from "./hooks/useChessActions";
import useMoveTrigger from "./hooks/useMoveTrigger";

// Runs the game
const BitboardGame = () => {
  const { userSide, promotion, promotionMove, isModalOpen, changeViewedMove } =
    useGameStore();
  // Handler for chess actions
  const { processMove, handleSquareClick, handlePromotion } = useChessActions();

  // Handler for creating and using an engine worker
  const { post: postToEngine } = useEngineWorker(processMove);

  // Handles engine moving after the player moves
  useMoveTrigger(postToEngine);

  return (
    <div className="body">
      <div className="gameWrap">
        <BitboardBoard onSquareClick={handleSquareClick} />
        {promotion && (
          <PromotionModal
            onPromote={handlePromotion}
            square={promotionMove.to}
            userPlayer={userSide}
          />
        )}
        <Sidebar changeBoardView={changeViewedMove} />
      </div>
      {isModalOpen && <Modal />}
    </div>
  );
};

export default BitboardGame;
