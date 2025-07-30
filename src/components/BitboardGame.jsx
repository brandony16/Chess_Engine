import { useGameStore } from "./gameStore.mjs";

import PromotionModal from "./modals/PromotionModal";
import Sidebar from "./sidebar/Sidebar";
import BitboardBoard from "./boardComponents/BitboardBoard";
import Modal from "./modals/Modal";

import useEngineWorker from "./hooks/useEngineWorker";
import useChessActions from "./hooks/useChessActions";
import useMoveTrigger from "./hooks/useMoveTrigger";

import "./UI.css";

// Runs the game
const BitboardGame = () => {
  // Get states
  const promotion = useGameStore((state) => state.promotion);
  const promotionMove = useGameStore((state) => state.promotionMove);
  const isModalOpen = useGameStore((state) => state.isModalOpen);

  // Handler for chess actions
  const { processMove, handleSquareClick, handlePromotion } = useChessActions();

  // Handler for creating and using an engine worker
  const { post: postToEngine } = useEngineWorker(processMove);

  // Handles engine moving after the player moves
  useMoveTrigger(postToEngine);

  return (
    <main className="body">
      <section className="gameWrap" role="application">
        <BitboardBoard onSquareClick={handleSquareClick} />
        {promotion && (
          <PromotionModal
            onPromote={handlePromotion}
            square={promotionMove.to}
          />
        )}
        <Sidebar />
      </section>
      {isModalOpen && <Modal />}
    </main>
  );
};

export default BitboardGame;
