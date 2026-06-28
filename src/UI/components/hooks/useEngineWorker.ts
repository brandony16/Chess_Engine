import { useCallback, useEffect, useRef } from "react";
import { useGameStore } from "../../gameStore.ts";
import type {
  EngineCommand,
  EngineWorkerResponse,
} from "../workers/engineWorker.ts";
import EngineWorker from "../workers/engineWorker?worker";
import { ContextType } from "../../../engines/searchContext.ts";

/**
 * Hook that creates an engine worker to make a move.
 */
export default function useEngineWorker() {
  const workerRef = useRef<Worker | null>(null);
  const playMove = useGameStore((state) => state.playMove);

  const engine = useGameStore((state) => state.selectedEngine);
  const depth = useGameStore((state) => state.searchDepth);
  const clockSettings = useGameStore((state) => state.clockSettings);
  const pastGames = useGameStore((state) => state.pastGames); // used to know when to reinitialize the engine

  // Create engine worker
  useEffect(() => {
    const w = new EngineWorker();

    w.onmessage = (e: { data: EngineWorkerResponse }) => {
      const response: EngineWorkerResponse = e.data;
      if (response.type === "move") {
        playMove(response.move, response.timeRemainingMs);
      }
    };
    workerRef.current = w;

    w.onerror = (e: ErrorEvent) => {
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
      console.log("initializing new engine");
      const initCmd: EngineCommand = {
        type: "init",
        engine,
        depth,
        clock: { type: ContextType.TIME_CONTROL, ...clockSettings },
      };
      workerRef.current.postMessage(initCmd);
    }
  }, [engine, depth, clockSettings, pastGames]);

  // Post function
  const post = useCallback((msg: EngineCommand) => {
    if (workerRef.current) {
      workerRef.current.postMessage(msg);
    }
  }, []);

  return { post, initEngineForNewGame };
}
