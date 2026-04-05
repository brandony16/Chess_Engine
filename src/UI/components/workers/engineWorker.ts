import type { EnginePost, EngineResponse } from "./engineWorkerTypes.ts";

self.onmessage = (e: MessageEvent<EnginePost>) => {
  const { pos, engine, ctx } = e.data;

  const move = engine.search(pos, ctx);

  const result: EngineResponse = { move };

  postMessage(result);
};
