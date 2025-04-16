import { useGameStore } from "./gameStore";
import "./GameHistory.css";

const GameHistoryModal = () => {
  const gameHistory = useGameStore((state) => state.gameHistory);
  const updateShownGame = useGameStore((state) => state.updateShownGame);

  const handleGameSelect = (game) => {
    updateShownGame(game);
    useGameStore.setState({ isGameHistoryMenuOpen: false, isModalOpen: false });
  };

  return (
    <div className="gameHistory">
      {gameHistory.map((game, index) => (
        <div className="pastGame" key={index} onClick={() => handleGameSelect(game)}>
          <p>
            Game: {index + 1}, Result: {game.result}, Moves: {Math.ceil(game.moves.length / 2)}
          </p>
        </div>
      ))}
    </div>
  );
};

export default GameHistoryModal;
