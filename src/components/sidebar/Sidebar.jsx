import PropTypes from "prop-types";
import MoveArrows from "./MoveArrows";
import MoveList from "./MoveList";
import { useGameStore } from "../gameStore.mjs";
import { WHITE } from "../../Core Logic/constants.mjs";
import { ModalTypes } from "../utilTypes";

import newGame from "../../assets/new.svg";
import battle from "../../assets/battle.svg";
import history from "../../assets/history.svg";
import flipBoard from "../../assets/flip.svg";

const Sidebar = ({ changeBoardView }) => {
  const {
    currPlayer,
    isGameOver,
    result,
    pastMoves,
    currIndexOfDisplayed,
    openModal,
    flipBoardView,
  } = useGameStore.getState();
  const turnText = currPlayer === WHITE ? "White's Turn" : "Black's Turn";

  return (
    <div className="sidebar">
      <div className="turnText">{isGameOver ? result : turnText}</div>
      <MoveList pastMoves={pastMoves} indexOfViewed={currIndexOfDisplayed} />
      <MoveArrows changeBoardView={changeBoardView} />
      <div className="iconBtnWrap">
        <button
          title="New game"
          className="newGame sidebarIconBtn"
          onClick={() => openModal(ModalTypes.NEW)}
        >
          <img className="sidebarIcon" src={newGame} alt="new game" />
        </button>
        <button
          title="Battle engines"
          className="engineBattle sidebarIconBtn"
          onClick={() => openModal(ModalTypes.BATTLE)}
        >
          <img className="sidebarIcon" src={battle} alt="battle engines" />
        </button>
        <button
          title="View previous games"
          className="prevGames sidebarIconBtn"
          onClick={() => openModal(ModalTypes.HISTORY)}
        >
          <img className="sidebarIcon" src={history} alt="view past games" />
        </button>
        <button
          title="Flip board orientation"
          className="flipBoard sidebarIconBtn"
          onClick={() => flipBoardView()}
        >
          <img className="sidebarIcon" src={flipBoard} alt="flip board" />
        </button>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  changeBoardView: PropTypes.func.isRequired,
};

export default Sidebar;
