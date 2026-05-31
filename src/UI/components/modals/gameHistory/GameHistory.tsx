import { useGameStore } from "../../../gameStore.ts";
import "./GameHistory.css";
import PastGame from "./PastGame.jsx";

// Game history menu to select past games.
const GameHistory = () => {
  const pastGames = useGameStore((state) => state.pastGames);

  return (
    <div className="game-history-modal">
      <div>In progress! Check back later</div>
      {pastGames.map((entry, index) => (
        <PastGame key={index} historyEntry={entry} index={index} />
      ))}
    </div>
  );
};

export default GameHistory;
