import { useEffect, type ReactNode } from "react";
import "./App.css";
import Board from "./components/boardComponents/Board.tsx";
import useChessActions from "./components/hooks/useChessActions.js";
import useEngineWorker from "./components/hooks/useEngineWorker.js";
import useMoveTrigger from "./components/hooks/useMoveTrigger.js";
import Sidebar from "./components/sidebar/Sidebar.jsx";
import { useGameStore } from "./gameStore.ts";
import GameClock from "./GameClock.tsx";
import GameOverModal from "./components/GameOverModal.tsx";
import PromotionModal from "./components/promotionModal/PromotionModal.tsx";

function App(): ReactNode {
  // Get states
  const promotion = useGameStore((state) => state.promotion);

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
        <div className="board-container">
          <GameOverModal />
          <Board onSquareClick={handleSquareClick} />
          {promotion.isHappening && (
            <PromotionModal
              onPromote={handlePromotion}
              square={promotion.square}
            />
          )}
        </div>
        <Sidebar />
      </section>
    </main>
  );
}

export default App;
