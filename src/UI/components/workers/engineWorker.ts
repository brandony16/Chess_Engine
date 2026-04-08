import { getEngineByName } from "../../../engines/engineList.ts";
import { createMaterialEngine } from "../../../engines/materialEngine.ts";
import { SearchContext } from "../../../engines/searchContext.ts";
import { moveFrom, movePiece, moveTo } from "../../../game/moveMaking/move.ts";
import { Position } from "../../../game/Position.ts";
import { rebuildPosiiton } from "./builders.ts";
import type { EnginePost, EngineResponse } from "./engineWorkerTypes.ts";

self.onmessage = (e: MessageEvent<EnginePost>) => {
  const { pos, engine, depth, ctx } = e.data;

  const eng = getEngineByName(engine, depth);

  const position = rebuildPosiiton(pos);
  const searchCtx = new SearchContext(ctx.nodeLimit);
  const move = eng.search(position, searchCtx);

  const result: EngineResponse = { move };

  postMessage(result);
};
