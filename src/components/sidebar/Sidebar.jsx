import PropTypes from "prop-types";
import MoveArrows from "./MoveArrows";
import MoveList from "./MoveList";
import { useGameStore } from "../gameStore";

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
  const openGameHistory = useGameStore((state) => state.openGameHistory);
  const openBattleMenu = useGameStore((state) => state.openBattleMenu);

  return (
    <div className="sidebar">
      <div className="turnText">{isGameOver ? result : turnText}</div>
      <MoveList pastMoves={pastMoves} indexOfViewed={indexOfViewedMove} />
      <button className="newGame" onClick={() => resetGame()}>
        New Game
      </button>
      <MoveArrows changeBoardView={changeBoardView} />
      <button className="engineBattle" onClick={() => openBattleMenu()}>
        Battle Engines
      </button>
      <button className="prevGames" onClick={() => openGameHistory()}>
        View previous games
      </button>
    </div>
  );
};

Sidebar.propTypes = {
  currPlayer: PropTypes.oneOf(["w", "b"]).isRequired,
  resetGame: PropTypes.func.isRequired,
  isGameOver: PropTypes.bool.isRequired,
  result: PropTypes.string,
  pastMoves: PropTypes.arrayOf(PropTypes.string).isRequired,
  changeBoardView: PropTypes.func.isRequired,
  indexOfViewedMove: PropTypes.number.isRequired,
};

export default Sidebar;
