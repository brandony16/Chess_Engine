import { useGameStore } from "../gameStore.mjs";

import chevronLeft from "../../assets/chevronLeft.svg";
import chevronRight from "../../assets/chevronRight.svg";
import React from "react";

const MoveArrows = () => {
  const changeViewedMove = useGameStore((state) => state.changeViewedMove);

  return (
    <div className="moveArrows">
      <button
        title="Go back one move"
        className="prevMove sidebarIconBtn moveArrow"
        onClick={() => changeViewedMove(-1)} // Back one move
      >
        <img className="sidebarIcon" src={chevronLeft} alt="go back one move" />
      </button>
      <button
        title="Go forward one move"
        className="nextMove sidebarIconBtn moveArrow"
        onClick={() => changeViewedMove(1)} // Forward one move
      >
        <img
          className="sidebarIcon"
          src={chevronRight}
          alt="go forward one move"
        />
      </button>
    </div>
  );
};

const MemoizedArrows = React.memo(MoveArrows);
MemoizedArrows.displayName = "MoveArrows";

export default MemoizedArrows;
