import React, { useCallback } from "react";
import { useGameStore } from "../../gameStore.ts";

export type MoveRowProps = {
  halfMove: number;
  whiteMove: string;
  blackMove: string | null;
};

const MoveRow = ({ halfMove, whiteMove, blackMove }: MoveRowProps) => {
  const goToMove = useGameStore((state) => state.goToMove);
  const currIdxOfDisplayed = useGameStore((state) => state.idxOfDisplayedMove);
  const timeSpent = useGameStore((state) => state.timeSpentPerMove);

  const goToWhiteMove = useCallback(
    () => goToMove(halfMove),
    [goToMove, halfMove],
  );

  const goToBlackMove = useCallback(
    () => goToMove(halfMove + 1),
    [goToMove, halfMove],
  );

  const formatTimeSpent = useCallback((timeMs: number) => {
    const timeSec = timeMs / 1000;

    if (timeSec < 60) {
      return timeSec.toFixed(1) + "s"; // show precision to 10ths of a second
    }

    const mins = Math.floor(timeSec / 60);
    const secs = Math.floor(timeSec - mins * 60);

    return `${mins}m ${secs}s`;
  }, []);

  const highlightWhite = halfMove + 1 === currIdxOfDisplayed;
  const highlightBlack = halfMove + 2 === currIdxOfDisplayed;

  return (
    <li
      key={halfMove / 2}
      className={`pastMove ${Math.floor(halfMove / 2) % 2 === 0 ? "alt" : ""}`}
    >
      <div className="moveNum">{halfMove / 2 + 1}.</div>

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

      <div className="timeSpent">
        <div className="timeWrap">
          <div className="timeSpentText">
            {formatTimeSpent(timeSpent[halfMove])}
          </div>
          <div className="moveBar white"></div>
        </div>
        {blackMove && (
          <div className="timeWrap">
            <div className="timeSpentText">
              {formatTimeSpent(timeSpent[halfMove + 1])}
            </div>
            <div className="moveBar black"></div>
          </div>
        )}
      </div>
    </li>
  );
};

const MemoizedEntry = React.memo(MoveRow);
MemoizedEntry.displayName = "MoveRow";

export default MemoizedEntry;
