import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useGameStore } from "../gameStore.mjs";

import MoveEntry from "./MoveEntry";

const MoveList = () => {
  // Get states
  const pastMoves = useGameStore((state) => state.pastMoves);
  const currIndexOfDisplayed = useGameStore(
    (state) => state.currIndexOfDisplayed
  );

  const selectedMoveNum = Math.floor(currIndexOfDisplayed / 2);
  const selectedSide = currIndexOfDisplayed % 2;

  // Creates move rows. White moves first, then black moves
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

  // Scroll to bottom of move list when move is made
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
          <MoveEntry
            key={moveNumber}
            moveNumber={moveNumber}
            whiteMove={whiteMove}
            blackMove={blackMove}
            highlightWhite={highlightWhite}
            highlightBlack={highlightBlack}
          />
        )
      )}
    </ul>
  );
};

const MemoizedMoveList = React.memo(MoveList);
MemoizedMoveList.displayName = "MoveList";

export default MemoizedMoveList;
