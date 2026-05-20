import React, { useCallback } from "react";
import { useGameStore } from "../../gameStore.ts";

export type MoveRowProps = {
  halfMove: number;
  whiteMove: string;
  blackMove: string | null;
};

const MoveRow = ({ halfMove, whiteMove, blackMove }: MoveRowProps) => {
  const goToMove = useGameStore((state) => state.goToMove);
  const currIdxOfDisplayed = useGameStore((state) => state.currIdxOfDisplayed);

  const goToWhiteMove = useCallback(
    () => goToMove(halfMove),
    [goToMove, halfMove],
  );

  const goToBlackMove = useCallback(
    () => goToMove(halfMove + 1),
    [goToMove, halfMove],
  );

  const highlightWhite = halfMove + 1 === currIdxOfDisplayed;
  const highlightBlack = halfMove + 2 === currIdxOfDisplayed;

  return (
    <li key={halfMove / 2} className="pastMove">
      <span className="moveNum">{halfMove / 2 + 1}.</span>

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

const MemoizedEntry = React.memo(MoveRow);
MemoizedEntry.displayName = "MoveRow";

export default MemoizedEntry;
