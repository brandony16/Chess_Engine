import React, { useCallback } from "react";

import { useGameStore } from "../gameStore.mjs";

import chevronLeft from "../../assets/chevronLeft.svg";
import chevronRight from "../../assets/chevronRight.svg";

const MoveArrows = () => {
  const changeViewedMove = useGameStore((state) => state.changeViewedMove);

  const goBack = useCallback(() => changeViewedMove(-1), [changeViewedMove]);
  const goForward = useCallback(() => changeViewedMove(1), [changeViewedMove]);

  return (
    <div className="moveArrows">
      <button
        aria-label="Go back one move"
        className="prevMove sidebarIconBtn moveArrow"
        onClick={goBack}
      >
        <img className="sidebarIcon" src={chevronLeft} alt="go back one move" />
      </button>
      <button
        aria-label="Go forward one move"
        className="nextMove sidebarIconBtn moveArrow"
        onClick={goForward}
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
