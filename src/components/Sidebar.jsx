import MoveList from "./MoveList";

const Sidebar = ({ currPlayer, resetGame, isGameOver, result, pastMoves }) => {
const turnText = currPlayer === "w" ? "White's Turn" : "Black's Turn";


  return (
    <div className="sidebar">
      <div className="turnText">{isGameOver ? result : turnText}</div>
      <MoveList pastMoves={pastMoves} />
      <button className="newGame" onClick={() => resetGame()}>
        New Game
      </button>

    </div>
  );
};

export default Sidebar;
