import React, { useCallback } from "react";
import { useGameStore } from "../gameStore.mjs";
import PropTypes from "prop-types";

const MoveEntry = ({
  moveNumber,
  whiteMove,
  blackMove,
  highlightWhite,
  highlightBlack,
}) => {
  const goToMove = useGameStore((state) => state.goToMove);

  const goToWhiteMove = useCallback(
    () => goToMove(moveNumber, 0),
    [goToMove, moveNumber]
  );

  const goToBlackMove = useCallback(
    () => blackMove && goToMove(moveNumber, 1), // Check if there is a second move before going there
    [blackMove, goToMove, moveNumber]
  );

  return (
    <li key={moveNumber} className="pastMove">
      <span className="moveNum">{moveNumber + 1}.</span>

      <button
        type="button"
        className={`move${highlightWhite ? " highlighted" : ""}`}
        onClick={goToWhiteMove}
      >
        {whiteMove}
      </button>

      <button
        type="button"
        className={`move${highlightBlack ? " highlighted" : ""}`}
        onClick={goToBlackMove}
      >
        {blackMove}
      </button>
    </li>
  );
};

MoveEntry.propTypes = {
  moveNumber: PropTypes.number.isRequired,
  whiteMove: PropTypes.string.isRequired,
  blackMove: PropTypes.string.isRequired,
  highlightWhite: PropTypes.bool.isRequired,
  highlightBlack: PropTypes.bool.isRequired,
};

const MemoizedEntry = React.memo(MoveEntry);
MemoizedEntry.displayName = "MoveEntry";

export default MemoizedEntry;
