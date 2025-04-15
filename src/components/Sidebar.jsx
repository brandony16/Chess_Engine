import PropTypes from "prop-types";
import MoveArrows from "./MoveArrows";
import MoveList from "./MoveList";
import { BMV1 } from "./bbEngines/BondMonkeyV1";
import { BMV2 } from "./bbEngines/BondMonkeyV2";

const Sidebar = ({
  currPlayer,
  resetGame,
  isGameOver,
  result,
  pastMoves,
  changeBoardView,
  indexOfViewedMove,
  battleTwoEngines,
  togglePrevGameMenu,
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
      <button
        className="engineBattle"
        onClick={() => battleTwoEngines(BMV2, BMV1, 5)}
      >
        Battle Engines
      </button>
      <button className="prevGames" onClick={() => togglePrevGameMenu()}>
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
  battleTwoEngines: PropTypes.func.isRequired,
  togglePrevGameMenu: PropTypes.func.isRequired,
};

export default Sidebar;
