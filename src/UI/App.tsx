import { useEffect, type ReactNode } from "react";
import "./App.css";
import Board from "./components/boardComponents/Board.tsx";
import useChessActions from "./components/hooks/useChessActions.js";
import useEngineWorker from "./components/hooks/useEngineWorker.js";
import useMoveTrigger from "./components/hooks/useMoveTrigger.js";
import Modal from "./components/modals/Modal.jsx";
import PromotionModal from "./components/modals/promotionModal/PromotionModal.jsx";
import Sidebar from "./components/sidebar/Sidebar.jsx";
import { useGameStore } from "./gameStore.ts";
import GameClock from "./GameClock.tsx";

function App(): ReactNode {
  // Get states
  const promotion = useGameStore((state) => state.promotion);
  const modalState = useGameStore((state) => state.modalState);

  // Handler for chess actions
  const { handleSquareClick, handlePromotion } = useChessActions();

  // Handler for creating and using an engine worker
  const { post: postToEngine, initEngineForNewGame } = useEngineWorker();

  // Handles engine moving after the player moves
  useMoveTrigger(postToEngine);

  useEffect(() => {
    initEngineForNewGame();
  }, [initEngineForNewGame]);

  return (
    <main className="body">
      <section className="gameWrap" role="application">
        <GameClock />
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
