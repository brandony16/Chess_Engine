import React, { useCallback } from "react";

import { useGameStore } from "../../gameStore.ts";

import chevronLeft from "../../assets/chevronLeft.svg";
import chevronRight from "../../assets/chevronRight.svg";

const MoveArrows = () => {
  const nextMove = useGameStore((state) => state.showNextMove);
  const prevMove = useGameStore((state) => state.showPreviousMove);

  return (
    <div className="moveArrows">
      <button
        aria-label="Go back one move"
        className="prevMove sidebarIconBtn moveArrow"
        onClick={prevMove}
      >
        <img className="sidebarIcon" src={chevronLeft} alt="go back one move" />
      </button>
      <button
        aria-label="Go forward one move"
        className="nextMove sidebarIconBtn moveArrow"
        onClick={nextMove}
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
