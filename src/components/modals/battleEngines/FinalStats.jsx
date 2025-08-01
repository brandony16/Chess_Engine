import PropTypes from "prop-types";

const FinalStats = ({ finalStats, engine1, engine2, onReset }) => {
  const { gameNum, wins, draws, losses, winRate } = finalStats;

  return (
    <section className="finalStats" role="region" aria-labelledby="vs-header">
      <h2 id="vs-header" className="versusHeader">
        {engine1} <span className="vs">vs.</span> {engine2}
      </h2>

      <h3 className="summaryHeader">
        Battle Result for <strong>{engine1}</strong>
      </h3>

      <dl className="statsGrid">
        <div className="statItem">
          <dt>Games</dt>
          <dd>{gameNum - 1}</dd>
        </div>
        <div className="statItem">
          <dt>Wins</dt>
          <dd>{wins}</dd>
        </div>
        <div className="statItem">
          <dt>Draws</dt>
          <dd>{draws}</dd>
        </div>
        <div className="statItem">
          <dt>Losses</dt>
          <dd>{losses}</dd>
        </div>
        <div className="statItem fullWidth">
          <dt>Win Rate</dt>
          <dd>{winRate}%</dd>
        </div>
      </dl>

      <button className="resetBtn" onClick={onReset}>
        Reset
      </button>
    </section>
  );
};

FinalStats.propTypes = {
  finalStats: PropTypes.shape({
    gameNum: PropTypes.number.isRequired,
    wins: PropTypes.number.isRequired,
    draws: PropTypes.number.isRequired,
    losses: PropTypes.number.isRequired,
    winRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      .isRequired,
  }).isRequired,
  engine1: PropTypes.string.isRequired,
  engine2: PropTypes.string.isRequired,
  onReset: PropTypes.func.isRequired,
};

export default FinalStats;
