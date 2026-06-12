import { useCallback, useEffect, useRef } from "react";
import { useGameStore } from "../../gameStore.ts";
import type { EnginePost } from "../workers/engineWorkerTypes.ts";
import type {
  EngineCommand,
  EngineWorkerResponse,
} from "../workers/engineWorker.ts";

/**
 * Hook that creates an engine worker to make a move.
 */
export default function useEngineWorker() {
  const workerRef = useRef<Worker | null>(null);
  const playMove = useGameStore((state) => state.playMove);

  const engine = useGameStore((state) => state.selectedEngine);
  const depth = useGameStore((state) => state.searchDepth);
  const clockSettings = useGameStore((state) => state.clockSettings);

  // Create engine worker
  useEffect(() => {
    const EngineWorker = new URL("../workers/engineWorker.ts", import.meta.url);
    const w = new Worker(EngineWorker, { type: "module" });

    w.onmessage = (e) => {
      const response: EngineWorkerResponse = e.data;
      if (response.type === "move") {
        playMove(response.move);
      }
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
  }, [playMove, engine, depth, clockSettings]);

  const initEngineForNewGame = useCallback(() => {
    if (workerRef.current) {
      const initCmd: EngineCommand = {
        type: "init",
        engine,
        depth,
        clock: clockSettings,
      };
      workerRef.current.postMessage(initCmd);
    }
  }, [engine, depth, clockSettings]);

  // Post function
  const post = useCallback((msg: EngineCommand) => {
    if (workerRef.current) {
      workerRef.current.postMessage(msg);
    }
  }, []);

  return { post, initEngineForNewGame };
}
