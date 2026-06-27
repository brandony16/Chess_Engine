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
          pastGames.map((game, index) => {
            // 1. Extract the result from the PGN string
            const resultMatch = game.pgn.match(/\[Result\s+"([^"]+)"\]/);
            const result = resultMatch ? resultMatch[1] : "*";

            // 2. Determine scores and winners
            const whiteWon = result === "1-0";
            const blackWon = result === "0-1";
            const isDraw = result === "1/2-1/2";

            const whiteScore = whiteWon
              ? "1"
              : blackWon
                ? "0"
                : isDraw
                  ? "½"
                  : "-";
            const blackScore = blackWon
              ? "1"
              : whiteWon
                ? "0"
                : isDraw
                  ? "½"
                  : "-";

            return (
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
                  <div className="header-details">
                    <span className="move-count">
                      {Math.ceil(game.plyCount / 2)} moves
                    </span>
                    <span className="reason-text">{game.reason}</span>
                  </div>
                </div>

                <div className="history-players">
                  {/* White Player Row */}
                  <div
                    className={`player-row ${whiteWon ? "winner" : isDraw ? "draw" : "loser"}`}
                  >
                    <div className="player-info">
                      <span className="color-indicator white-dot"></span>
                      <span className="player-name">{game.white}</span>
                    </div>
                    <span className="player-score">{whiteScore}</span>
                  </div>

                  {/* Black Player Row */}
                  <div
                    className={`player-row ${blackWon ? "winner" : isDraw ? "draw" : "loser"}`}
                  >
                    <div className="player-info">
                      <span className="color-indicator black-dot"></span>
                      <span className="player-name">{game.black}</span>
                    </div>
                    <span className="player-score">{blackScore}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <button className="back-btn" onClick={() => setSidebarMode("setup")}>
        Back to Menu
      </button>
    </div>
  );
}
