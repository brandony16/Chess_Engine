import PropTypes from "prop-types";

const Loading = ({ gameNum, totalGames }) => {
  return (
    <div className="loadingScreen" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true"></div>
      <p className="loadingText">
        Processing game {gameNum} of {totalGames}…
      </p>
    </div>
  );
};

Loading.propTypes = {
  gameNum: PropTypes.number.isRequired,
  totalGames: PropTypes.number.isRequired,
};

export default Loading;