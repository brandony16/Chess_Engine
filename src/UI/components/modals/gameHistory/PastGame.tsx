import { useCallback } from "react";

import { useGameStore, type HistoryEntry } from "../../../gameStore.ts";

const playerMap = { 0: "w", 1: "b" };

type PastGameProps = {
  historyEntry: HistoryEntry;
  index: number;
};

const PastGame = ({ historyEntry, index }: PastGameProps) => {
  const updateShownGame = useGameStore((state) => state.updateShownGame);
  const closeModal = useGameStore((state) => state.closeModal);

  const getResultClass = useCallback((entry: HistoryEntry) => {
    if (entry.engineGame) return "engine-game";
    const text = entry.result.toLowerCase();
    if (text.charAt(0) === "d") return "Draw";
    if (text.charAt(0) === playerMap[game.userSide]) return "Win";
    return "Loss";
  }, []);

  const handleGameSelect = useCallback(
    (entry: HistoryEntry) => {
      updateShownGame(entry);
      closeModal();
    },
    [updateShownGame, closeModal],
  );

  return (
    <div className="game-card" onClick={() => handleGameSelect(historyEntry)}>
      <div className="game-info">
        <p className="game-title">Game {index + 1}</p>
        <p className={`game-result ${getResultClass(historyEntry)}`}>{something.result}</p>
      </div>

      <div className="game-meta">
        <p className="game-moves">Moves: {Math.ceil(getthemoves.moves.length / 2)}</p>
        {historyEntry.engineGame ? (
          <span className="engine-flag">Engine Game</span>
        ) : (
          <span className="user-side">{getResultClass(historyEntry)}</span>
        )}
      </div>
    </div>
  );
};


export default PastGame;
