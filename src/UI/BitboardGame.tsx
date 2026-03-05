import { useGameStore } from "./gameStore.ts";

import PromotionModal from "./components/modals/promotionModal/PromotionModal.jsx";
import Sidebar from "./components/sidebar/Sidebar.jsx";
import BitboardBoard from "./components/boardComponents/Board.tsx";
import Modal from "./components/modals/Modal.jsx";

import useEngineWorker from "./components/hooks/useEngineWorker.js";
import useChessActions from "./components/hooks/useChessActions.js";
import useMoveTrigger from "./components/hooks/useMoveTrigger.js";
import type { ReactNode } from "react";

import "./UI.css";

// Runs the game
const BitboardGame = (): ReactNode => {
  // Get states
  const promotion = useGameStore((state) => state.promotion);
  const promotionMove = useGameStore((state) => state.promotionMove);
  const modalState = useGameStore((state) => state.modalState);

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
      {modalState.isOpen && <Modal />}
    </main>
  );
};

export default BitboardGame;
