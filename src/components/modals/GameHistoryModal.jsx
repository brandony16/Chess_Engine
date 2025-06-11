import { useGameStore } from "../gameStore.mjs";
import "./GameHistory.css";

// Game history menu to select past games.
const GameHistoryModal = () => {
  const { gameHistory, updateShownGame, closeModal } = useGameStore.getState();

  const getResultClass = (game) => {
    if (game.isEngineGame) return "engine-game";
    const text = game.result.toLowerCase();
    if (text.charAt(0) === "d") return "Draw";
    if (text.charAt(0) === playerMap[game.userSide]) return "Win";
    return "Loss";
  };

  const playerMap = { 0: "w", 1: "b" };

  const handleGameSelect = (game) => {
    updateShownGame(game);
    closeModal();
  };

  return (
    <div className="game-history-modal">
      {gameHistory.map((game, index) => (
        <div
          className="game-card"
          key={index}
          onClick={() => handleGameSelect(game)}
        >
          <div className="game-info">
            <p className="game-title">Game {index + 1}</p>
            <p className={`game-result ${getResultClass(game)}`}>
              {game.result}
            </p>
          </div>

          <div className="game-meta">
            <p className="game-moves">
              Moves: {Math.ceil(game.moves.length / 2)}
            </p>
            {game.isEngineGame ? (
              <span className="engine-flag">Engine Game</span>
            ) : (
              <span className="user-side">{getResultClass(game)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GameHistoryModal;
