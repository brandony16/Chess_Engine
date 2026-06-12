import {
  getEngineByName,
  type EngineName,
} from "../../../engines/bondmonkeyVersions/engineList.ts";
import type { Bondmonkey } from "../../../engines/bondmonkeyVersions/type.ts";
import {
  SearchContext,
  type ClockType,
} from "../../../engines/searchContext.ts";
import type { Position } from "../../../game/Position.ts";
import { rebuildPosition } from "./builders.ts";

let activeEngine: Bondmonkey | null = null;
let activeContext: SearchContext | null = null;

// Define the incoming commands from the UI
export type EngineCommand =
  | { type: "init"; engine: EngineName; depth: number; clock: ClockType }
  | { type: "search"; pos: Position };

// Define the outgoing responses to the UI
export type EngineWorkerResponse =
  | { type: "initialized" }
  | {
      type: "move";
      move: number;
      timeRemainingMs: number; // Send this back so UI can sync
    };

self.onmessage = (e: MessageEvent<EngineCommand>) => {
  const msg = e.data;

  if (msg.type === "init") {
    activeEngine = getEngineByName(msg.engine, msg.depth);
    activeContext = new SearchContext(msg.clock);

    activeEngine.newGame();

    postMessage({ type: "initialized" });
  } else if (msg.type === "search") {
    // Safety check
    if (!activeEngine || !activeContext) {
      console.error(
        "Worker was not initialized. Call init first, then search.",
      );
      return;
    }

    const position = rebuildPosition(msg.pos);

    const move = activeEngine.search(position, activeContext);

    postMessage({
      type: "move",
      move,
      timeRemainingMs: activeContext.timeRemaining,
    });
  }
};
