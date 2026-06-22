import { useGameStore } from "../../../gameStore.ts";
import "./HistoryMenu.css";

export default function HistoryMenu() {
  const pastGames = useGameStore((state) => state.pastGames);
  const setSidebarMode = useGameStore((state) => state.setSidebarMode);
  const updateShownGame = useGameStore((state) => state.updateShownGame);

  return (
    <div className="history-menu">
      <h2 className="turnText">Match History</h2>

      <div className="history-scroll-area">
        {pastGames.length === 0 ? (
          <div className="empty-history">
            <p>No games played yet.</p>
            <p className="empty-sub">Play a match to see it here.</p>
          </div>
        ) : (
          pastGames.map((game, index) => (
            <button
              key={index}
              className="history-card"
              onClick={() => {
                updateShownGame(game);
              }}
            >
              <div className="history-card-header">
                <span
                  className={`game-type-badge ${game.engineGame ? "engine" : "battle"}`}
                >
                  {game.engineGame ? "Engine Game" : "Normal Battle"}
                </span>
                <span className="move-count">
                  {Math.ceil(game.plyCount / 2)} moves
                </span>
              </div>

              <div className="history-players">
                <div className="player">
                  <span className="color-indicator white-dot"></span>
                  <span className="player-name">{game.white}</span>
                </div>
                <div className="vs">vs</div>
                <div className="player">
                  <span className="color-indicator black-dot"></span>
                  <span className="player-name">{game.black}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <button
        className="back-btn"
        onClick={() => setSidebarMode("setup")} // Or "playing" depending on where they came from
      >
        Back to Menu
      </button>
    </div>
  );
}
