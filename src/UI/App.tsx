import type { ReactNode } from "react";
import "./App.css";
import Board from "./components/boardComponents/Board.tsx";
import useChessActions from "./components/hooks/useChessActions.js";
import useEngineWorker from "./components/hooks/useEngineWorker.js";
import useMoveTrigger from "./components/hooks/useMoveTrigger.js";
import Modal from "./components/modals/Modal.jsx";
import PromotionModal from "./components/modals/promotionModal/PromotionModal.jsx";
import Sidebar from "./components/sidebar/Sidebar.jsx";
import { useGameStore } from "./gameStore.ts";
import { PerftProfiler } from "./components/Profiler.tsx";

function App(): ReactNode {
  // Get states
  const promotion = useGameStore((state) => state.promotion);
  const modalState = useGameStore((state) => state.modalState);

  // Handler for chess actions
  const { handleSquareClick, handlePromotion } = useChessActions();

  // Handler for creating and using an engine worker
  const { post: postToEngine } = useEngineWorker();

  // Handles engine moving after the player moves
  useMoveTrigger(postToEngine);

  return (
    <main className="body">
      <section className="gameWrap" role="application">
        <Board onSquareClick={handleSquareClick} />
        {promotion.isHappening && (
          <PromotionModal
            onPromote={handlePromotion}
            square={promotion.square}
          />
        )}
        <Sidebar />
      </section>
      {modalState.isOpen && <Modal />}
    </main>
  );
}

export default App;
