import { getEngineByName } from "../../../engines/bondmonkeyVersions/engineList.ts";
import { SearchContext } from "../../../engines/searchContext.ts";
import { rebuildPosiiton } from "./builders.ts";
import type { EnginePost, EngineResponse } from "./engineWorkerTypes.ts";

self.onmessage = (e: MessageEvent<EnginePost>) => {
  const { pos, engine, depth, ctx } = e.data;

  const eng = getEngineByName(engine, depth);

  const position = rebuildPosiiton(pos);
  const searchCtx = new SearchContext(ctx.nodeLimit, ctx.timeLimit);
  const move = eng.search(position, searchCtx);

  const result: EngineResponse = { move };

  postMessage(result);
};
