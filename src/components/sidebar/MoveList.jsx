import React, { useEffect, useRef } from "react";
import { useGameStore } from "../gameStore.mjs";

const MoveList = () => {
  // Get states
  const pastMoves = useGameStore((state) => state.pastMoves);
  const currIndexOfDisplayed = useGameStore(
    (state) => state.currIndexOfDisplayed
  );

  const goToMove = useGameStore((state) => state.goToMove);
  const selectedMoveNum = Math.floor(currIndexOfDisplayed / 2);
  const moveListRef = useRef(null);

  // Scrolls to the bottom when a move is made
  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [pastMoves]);

  return (
    <div className="moveList" ref={moveListRef}>
      {pastMoves
        .map(
          (_, index) =>
            index % 2 === 0 && [pastMoves[index], pastMoves[index + 1]]
        )
        .filter(Boolean)
        .map((pair, moveNumber) => {
          let moveID = -1;
          if (moveNumber === selectedMoveNum) {
            moveID = currIndexOfDisplayed % 2;
          }
          return (
            <div key={moveNumber} className="pastMove" id={moveNumber}>
              <div className="moveNum">{moveNumber + 1}.</div>
              <div
                className={`move ${moveID === 0 ? "highlighted" : ""}`}
                onClick={() => goToMove(moveNumber, 0)}
              >
                {pair[0]}
              </div>
              <div
                className={`move ${moveID === 1 ? "highlighted" : ""}`}
                onClick={() => (pair[1] ? goToMove(moveNumber, 1) : null)}
              >
                {pair[1] || ""}
              </div>
            </div>
          );
        })}
    </div>
  );
};

const MemoizedMoveList = React.memo(MoveList);
MemoizedMoveList.displayName = "MoveList";

export default MemoizedMoveList;
