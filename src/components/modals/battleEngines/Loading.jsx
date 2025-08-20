import PropTypes from "prop-types";
import React from "react";

const Loading = ({ gameNum, totalGames }) => {
  return (
    <div className="loadingScreen" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true"></div>
      <p className="loadingText">
        Playing game {gameNum} of {totalGames}…
      </p>
    </div>
  );
};

Loading.propTypes = {
  gameNum: PropTypes.number.isRequired,
  totalGames: PropTypes.number.isRequired,
};

const MemoizedLoading = React.memo(Loading);
MemoizedLoading.displayName = "Loading";

export default MemoizedLoading;
