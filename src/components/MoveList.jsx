import PropTypes from "prop-types";
import { useEffect, useRef } from "react";

const MoveList = ({ pastMoves, indexOfViewed }) => {
  const selectedMoveNum = Math.floor(indexOfViewed / 2);
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
            moveID = indexOfViewed % 2;
          }
          return (
            <div key={moveNumber} className="pastMove">
              <div className="moveNum">{moveNumber + 1}.</div>
              <div className={`move ${moveID === 0 ? "highlighted" : ""}`}>
                {pair[0]}
              </div>
              <div className={`move ${moveID === 1 ? "highlighted" : ""}`}>
                {pair[1] || ""}
              </div>
            </div>
          );
        })}
    </div>
  );
};

MoveList.propTypes = {
  pastMoves: PropTypes.arrayOf(PropTypes.string).isRequired,
  indexOfViewed: PropTypes.number.isRequired,
};

export default MoveList;
