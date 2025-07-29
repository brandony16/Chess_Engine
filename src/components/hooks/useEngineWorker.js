import { useCallback, useEffect, useRef } from "react";

import EngineWorker from "../bbEngines/engineWorker.mjs?worker";

/**
 * Hook that creates an engine worker to make a move.
 *
 * @param {func} onMove - what to do on a move
 */
export default function useEngineWorker(onMove) {
  const workerRef = useRef(null);

  // Create engine worker
  useEffect(() => {
    const w = new EngineWorker();
    w.onmessage = (e) => {
      const { move } = e.data;
      onMove(move.from, move.to, move.promotion);
    };
    workerRef.current = w;

    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, [onMove]);

  // Post function
  const post = useCallback((msg) => {
    if (workerRef.current) {
      workerRef.current.postMessage(msg);
    }
  }, []);

  return { post };
}
