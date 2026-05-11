import type { BattleWorkerResponse } from "../../workers/battleEngineWorker.ts";

type FinalStatsProps = {
  stats: BattleWorkerResponse;
  engine1: string;
  engine2: string;
  onReset: () => void;
};

const FinalStats = ({ stats, engine1, engine2, onReset }: FinalStatsProps) => {
  const { games, wins, draws, losses, winRate } = stats;

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
          <dd>{games}</dd>
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
export default FinalStats;
