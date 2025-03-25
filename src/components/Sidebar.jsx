import MoveArrows from "./MoveArrows";
import MoveList from "./MoveList";

const Sidebar = ({
  currPlayer,
  resetGame,
  isGameOver,
  result,
  pastMoves,
  changeBoardView,
  indexOfViewedMove,
}) => {
  const turnText = currPlayer === "w" ? "White's Turn" : "Black's Turn";

  return (
    <div className="sidebar">
      <div className="turnText">{isGameOver ? result : turnText}</div>
      <MoveList pastMoves={pastMoves} indexOfViewed={indexOfViewedMove} />
      <button className="newGame" onClick={() => resetGame()}>
        New Game
      </button>
      <MoveArrows changeBoardView={changeBoardView} />
    </div>
  );
};

export default Sidebar;
