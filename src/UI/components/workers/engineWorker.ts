import { createRandomEngine } from "../../../engines/randomEngine.ts";
import type { EnginePost, EngineResponse } from "./engineWorkerTypes.ts";

self.onmessage = (e: MessageEvent<EnginePost>) => {
  const { pos, engine, depth, timeLimit } = e.data;

  const engineObj = createRandomEngine(Math.random);
  const move = engineObj.search(pos, timeLimit);

  const result: EngineResponse = { move };

  postMessage(result);
};
