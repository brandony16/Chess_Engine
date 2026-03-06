import { clearTT } from "../../../coreLogic/transpositionTable.mjs";
import { engineRegistry } from "./engineRegistry.mjs";
import type { EnginePost, EngineResponse } from "./engineWorkerTypes.ts";

self.onmessage = (e: MessageEvent<EnginePost>) => {
  const { game, engine, depth, timeLimit } = e.data;

  clearTT();

  const engineFn = engineRegistry[engine];
  const move = engineFn(game, depth, timeLimit);

  const result: EngineResponse = { move };

  postMessage(result);
};
