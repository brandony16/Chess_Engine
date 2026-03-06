import React, { useCallback } from "react";
import { useGameStore } from "../../gameStore.ts";

const MoveEntry = ({
  moveNumber,
  whiteMove,
  blackMove,
  highlightWhite,
  highlightBlack,
}) => {
  const goToMove = useGameStore((state) => state.goToMove);

  const halfMoveNum = (moveNumber - 1) * 2;

  const goToWhiteMove = useCallback(
    () => goToMove(halfMoveNum),
    [goToMove, moveNumber],
  );

  const goToBlackMove = useCallback(
    () => goToMove(halfMoveNum + 1), // Check if there is a second move before going there
    [goToMove, moveNumber],
  );

  return (
    <li key={moveNumber} className="pastMove">
      <span className="moveNum">{moveNumber + 1}.</span>

      <button
        type="button"
        className={`move ${highlightWhite ? "highlighted" : ""}`}
        onClick={goToWhiteMove}
      >
        {whiteMove}
      </button>

      {blackMove && (
        <button
          type="button"
          className={`move ${highlightBlack ? "highlighted" : ""}`}
          onClick={goToBlackMove}
        >
          {blackMove}
        </button>
      )}
    </li>
  );
};

const MemoizedEntry = React.memo(MoveEntry);
MemoizedEntry.displayName = "MoveEntry";

export default MemoizedEntry;
