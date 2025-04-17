import { useGameStore } from "../gameStore";
import "./GameHistory.css";

// Game history menu to select past games.
const GameHistoryModal = () => {
  const gameHistory = useGameStore((state) => state.gameHistory);
  const updateShownGame = useGameStore((state) => state.updateShownGame);
  const closeModal = useGameStore((state) => state.closeModal);

  const handleGameSelect = (game) => {
    updateShownGame(game);
    closeModal();
  };

  return (
    <div className="gameHistory">
      {gameHistory.map((game, index) => (
        <div
          className="pastGame"
          key={index}
          onClick={() => handleGameSelect(game)}
        >
          <p className="modalText">Game: {index + 1},</p>
          <p className="modalText">Result: {game.result},</p>
          <p className="modalText">Moves: {Math.ceil(game.moves.length / 2)}</p>
          <p className="modalText">{game.isEngineGame ? "Engine Game" : ""}</p>
        </div>
      ))}
    </div>
  );
};

export default GameHistoryModal;
