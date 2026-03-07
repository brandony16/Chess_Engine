import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useGameStore } from "../../gameStore.ts";

import MoveRow, { type MoveRowProps } from "./MoveRow.tsx";

const MoveList = () => {
  // Get states
  const algebraicMoves = useGameStore((state) => state.algebraicMoves);

  // Creates move rows. White moves first, then black moves
  const moveRows = useMemo(() => {
    const rows: MoveRowProps[] = [];
    for (let i = 0; i < algebraicMoves.length; i += 2) {
      rows.push({
        halfMove: i,
        whiteMove: algebraicMoves[i],
        blackMove: algebraicMoves[i + 1] || null,
      });
    }
    return rows;
  }, [algebraicMoves]);

  // Scroll to bottom of move list when move is made
  const moveListRef = useRef<HTMLUListElement | null>(null);
  useLayoutEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [moveRows.length]);

  return (
    <ul className="moveList" ref={moveListRef} role="list">
      {moveRows.map(({ halfMove, whiteMove, blackMove }) => (
        <MoveRow
          key={halfMove}
          halfMove={halfMove}
          whiteMove={whiteMove}
          blackMove={blackMove}
        />
      ))}
    </ul>
  );
};

const MemoizedMoveList = React.memo(MoveList);
MemoizedMoveList.displayName = "MoveList";

export default MemoizedMoveList;
