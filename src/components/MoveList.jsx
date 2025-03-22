import { useEffect, useRef } from "react";

const MoveList = ({ pastMoves }) => {
  const moveListRef = useRef(null);

  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [pastMoves]); // Run effect whenever pastMoves updates

  return (
    <div className="moveList" ref={moveListRef} >
      {pastMoves
        .map((_, index) => index % 2 === 0 && [pastMoves[index], pastMoves[index + 1]])
        .filter(Boolean)
        .map((pair, moveNumber) => (
          <div key={moveNumber} className="pastMove">
              <div className="moveNum">{moveNumber + 1}.</div> 
              <div className="move">{pair[0]}</div>
              <div className="move">{pair[1] || ""}</div>
            </div>
        ))}
    </div>
  );
};

export default MoveList;
