import { useCallback, useEffect, useRef } from "react";
import { useGameStore } from "../../gameStore.ts";

/**
 * Hook that creates an engine worker to make a move.
 */
export default function useEngineWorker() {
  const workerRef = useRef(null);
  const playMove = useGameStore((state) => state.playMove);

  // Create engine worker
  useEffect(() => {
    const EngineWorker = new URL(
      "../workers/engineWorker.mjs",
      import.meta.url,
    );
    const w = new Worker(EngineWorker, { type: "module" });

    w.onmessage = (e) => {
      const { move } = e.data;
      playMove(move.from, move.to, move.promotion);
    };
    workerRef.current = w;

    w.onerror = (e) => {
      console.error(
        "Worker runtime error:",
        e.message,
        e.filename,
        e.lineno,
        e.colno,
      );
    };

    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, [playMove]);

  // Post function
  const post = useCallback((msg) => {
    if (workerRef.current) {
      workerRef.current.postMessage(msg);
    }
  }, []);

  return { post };
}
