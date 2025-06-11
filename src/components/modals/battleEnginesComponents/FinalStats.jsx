import PropTypes from "prop-types";

const FinalStats = ({ finalStats, engine1, engine2, onReset }) => {
  return (
    <div className="finalStats">
      <div className="versusHeader">
        {engine1} vs. {engine2}
      </div>
      <div className="finalStatHeader">Battle Result For {engine1}:</div>
      <div className="stat games">Games: {finalStats.gameNum - 1}</div>
      <div className="stat wins">
        Wins: {finalStats.wins}
      </div>
      <div className="stat draws">
        Draws: {finalStats.draws}
      </div>
      <div className="stat losses">
        Losses: {finalStats.losses}
      </div>
      <div className="stat winRate">
        Win Rate: {finalStats.winRate}
      </div>
      <button className="reset" onClick={() => onReset()}>
        Reset
      </button>
    </div>
  );
};

FinalStats.propTypes = {
  finalStats: PropTypes.object.isRequired,
  engine1: PropTypes.string.isRequired,
  engine2: PropTypes.string.isRequired,
  onReset: PropTypes.func.isRequired,
};

export default FinalStats;
