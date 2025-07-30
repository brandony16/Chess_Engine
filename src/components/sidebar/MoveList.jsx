import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useGameStore } from "../gameStore.mjs";

const MoveList = () => {
  // Get states
  const pastMoves = useGameStore((state) => state.pastMoves);
  const currIndexOfDisplayed = useGameStore(
    (state) => state.currIndexOfDisplayed
  );

  const goToMove = useGameStore((state) => state.goToMove);
  const selectedMoveNum = Math.floor(currIndexOfDisplayed / 2);
  const selectedSide = currIndexOfDisplayed % 2;

  const moveRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < pastMoves.length; i += 2) {
      const moveNumber = i / 2;
      rows.push({
        moveNumber,
        whiteMove: pastMoves[i] || "",
        blackMove: pastMoves[i + 1] || "",
        highlightWhite: moveNumber === selectedMoveNum && selectedSide === 0,
        highlightBlack: moveNumber === selectedMoveNum && selectedSide === 1,
      });
    }
    return rows;
  }, [pastMoves, selectedMoveNum, selectedSide]);

  const moveListRef = useRef(null);
  useLayoutEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [moveRows.length]);

  return (
    <ul className="moveList" ref={moveListRef} role="list">
      {moveRows.map(
        ({
          moveNumber,
          whiteMove,
          blackMove,
          highlightWhite,
          highlightBlack,
        }) => (
          <li key={moveNumber} className="pastMove">
            <span className="moveNum">{moveNumber + 1}.</span>

            <button
              type="button"
              className={`move${highlightWhite ? " highlighted" : ""}`}
              onClick={() => goToMove(moveNumber, 0)}
              aria-current={highlightWhite ? "step" : undefined}
            >
              {whiteMove}
            </button>

            <button
              type="button"
              className={`move${highlightBlack ? " highlighted" : ""}`}
              onClick={() => blackMove && goToMove(moveNumber, 1)}
              aria-current={highlightBlack ? "step" : undefined}
            >
              {blackMove}
            </button>
          </li>
        )
      )}
    </ul>
  );
};

const MemoizedMoveList = React.memo(MoveList);
MemoizedMoveList.displayName = "MoveList";

export default MemoizedMoveList;
