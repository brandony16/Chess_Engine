import { useCallback } from "react";
import PropTypes from "prop-types";

import { useGameStore } from "../../gameStore.mjs";

const playerMap = { 0: "w", 1: "b" };

const PastGame = ({ game, index }) => {
  const updateShownGame = useGameStore((state) => state.updateShownGame);
  const closeModal = useGameStore((state) => state.closeModal);

  const getResultClass = useCallback((game) => {
    if (game.isEngineGame) return "engine-game";
    const text = game.result.toLowerCase();
    if (text.charAt(0) === "d") return "Draw";
    if (text.charAt(0) === playerMap[game.userSide]) return "Win";
    return "Loss";
  }, []);

  const handleGameSelect = useCallback(
    (game) => {
      updateShownGame(game);
      closeModal();
    },
    [updateShownGame, closeModal]
  );

  return (
    <div className="game-card" onClick={() => handleGameSelect(game)}>
      <div className="game-info">
        <p className="game-title">Game {index + 1}</p>
        <p className={`game-result ${getResultClass(game)}`}>{game.result}</p>
      </div>

      <div className="game-meta">
        <p className="game-moves">Moves: {Math.ceil(game.moves.length / 2)}</p>
        {game.isEngineGame ? (
          <span className="engine-flag">Engine Game</span>
        ) : (
          <span className="user-side">{getResultClass(game)}</span>
        )}
      </div>
    </div>
  );
};

PastGame.propTypes = {
  game: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
};

export default PastGame;
