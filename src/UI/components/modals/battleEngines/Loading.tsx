import React from "react";

type LoadingProps = {
  currGame: number;
  totalGames: number;
};

const Loading = ({ currGame, totalGames }: LoadingProps) => {
  return (
    <div className="loadingScreen" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true"></div>
      <p className="loadingText">
        Playing game {currGame} of {totalGames}…
      </p>
    </div>
  );
};

const MemoizedLoading = React.memo(Loading);
MemoizedLoading.displayName = "Loading";

export default MemoizedLoading;
