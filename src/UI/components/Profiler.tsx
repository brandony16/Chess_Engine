import { useState } from "react";
import { Position } from "../../game/Position.ts";
import { perft } from "../../__tests__/game_tests/moveGen/perft.ts";

interface Result {
  nodes: number;
  time: number;
  nps: number;
}

export const PerftProfiler = () => {
  const [depth, setDepth] = useState(5);
  const [result, setResult] = useState<Result | null>(null);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    setResult(null);

    // Let React re-render to show "running" before blocking the thread
    setTimeout(() => {
      const pos = new Position();

      // Warmup
      perft(pos, 3);
      pos.loadInitialPosition();

      const start = performance.now();
      const nodes = perft(pos, depth);
      const end = performance.now();
      const time = end - start;

      setResult({
        nodes,
        time,
        nps: Math.round((nodes / time) * 1000),
      });
      setRunning(false);
    }, 50);
  };

  return (
    <div>
      <label>
        Depth:
        <input
          type="number"
          value={depth}
          min={1}
          max={7}
          onChange={(e) => setDepth(Number(e.target.value))}
        />
      </label>
      <button onClick={run} disabled={running}>
        {running ? "Running..." : "Run Perft"}
      </button>
      {result && (
        <div>
          <p>Nodes: {result.nodes.toLocaleString()}</p>
          <p>Time: {result.time.toFixed(0)}ms</p>
          <p>NPS: {result.nps.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};
