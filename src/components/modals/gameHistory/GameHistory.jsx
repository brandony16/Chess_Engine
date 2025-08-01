import { useGameStore } from "../../gameStore.mjs";
import "./GameHistory.css";
import PastGame from "./PastGame";

// Game history menu to select past games.
const GameHistory = () => {
  const gameHistory = useGameStore((state) => state.gameHistory);

  return (
    <div className="game-history-modal">
      {gameHistory.map((game, index) => (
        <PastGame key={index} game={game} index={index} />
      ))}
    </div>
  );
};

export default GameHistory;
