import { useCallback, useEffect, useRef } from "react";
import { useGameStore } from "../../gameStore.ts";
import type { EnginePost } from "../workers/engineWorkerTypes.ts";

/**
 * Hook that creates an engine worker to make a move.
 */
export default function useEngineWorker() {
  const workerRef = useRef<Worker | null>(null);
  const playMove = useGameStore((state) => state.playMove);

  // Create engine worker
  useEffect(() => {
    const EngineWorker = new URL(
      "../workers/engineWorker.ts",
      import.meta.url,
    );
    const w = new Worker(EngineWorker, { type: "module" });

    w.onmessage = (e) => {
      const { move } = e.data;
      playMove(move);
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
  const post = useCallback((msg: EnginePost) => {
    if (workerRef.current) {
      workerRef.current.postMessage(msg);
    }
  }, []);

  return { post };
}
