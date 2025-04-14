import { useGameStore } from "./gameStore";

const GameHistoryModal = ({}) => {
  const gameHistory = useGameStore((state) => state.gameHistory);
  const updateShownGame = useGameStore((state) => state.updateShownGame);

  const handleGameSelect = (game) => {
    updateShownGame(game);
    useGameStore.setState({ isGameHistoryMenuOpen: false });
  };

  return (
    <div className="gameHistoryModal modal">
      {gameHistory.map((game, index) => (
        <div key={index} onClick={() => handleGameSelect(game)}>
          <p>
            Game: {index}, Result: {game.result}, Moves: {game.moves.length}
          </p>
        </div>
      ))}
    </div>
  );
};

export default GameHistoryModal;
