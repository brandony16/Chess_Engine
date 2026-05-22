import { parentPort } from "worker_threads";
import { Position } from "../../game/Position.ts";
import { SearchContext } from "../searchContext.ts";
import { playOpeningMoves } from "./openings.ts";
import { DRAW } from "../../game/chessConstants.ts";
import {
  getEngineByName,
  type EngineName,
} from "../bondmonkeyVersions/engineList.ts";
import type { Bondmonkey } from "../bondmonkeyVersions/type.ts";
import { MinimaxV8 } from "../minimaxEngines/v8.ts";
import { evaluateV4 } from "../evaluation/evaluationv4.ts";

function warmupJIT() {
  const warmupPos = new Position();
  const warmupV8 = new MinimaxV8(32);
  const ctx = new SearchContext(Infinity, 100); // 100ms per move

  // Play 10 moves to force V8 to compile the negamax function
  for (let i = 0; i < 10; i++) {
    ctx.reset(Infinity, 100);
    const move = warmupV8.search(warmupPos, evaluateV4, ctx);
    warmupPos.makeMove(move);
  }
}

warmupJIT();

async function playSingleGame(
  white: Bondmonkey,
  black: Bondmonkey,
  openingMoves: string[],
  timeLimitMs: number,
) {
  const pos = new Position();
  const MAX_PLY = 512;

  white.newGame();
  black.newGame();

  await playOpeningMoves(openingMoves, pos);
  const ctx = new SearchContext(Infinity, timeLimitMs);

  while (!pos.gameOver() && pos.fullmoveNumber * 2 < MAX_PLY) {
    ctx.reset(Infinity, timeLimitMs);
    const whiteMove = white.search(pos, ctx);
    pos.makeMove(whiteMove);

    pos.checkGameOver();
    if (pos.gameOver()) break;

    ctx.reset(Infinity, timeLimitMs);
    const blackMove = black.search(pos, ctx);
    pos.makeMove(blackMove);

    pos.checkGameOver();
  }

  if (pos.fullmoveNumber * 2 >= MAX_PLY) return DRAW;
  return pos.result;
}

export type EngineConfig = {
  version: EngineName;
  depth: number;
};

export type MatchMessage = {
  e1Config: EngineConfig;
  e2Config: EngineConfig;
  openingMoves: string[];
  timeLimitMs: number;
};

parentPort?.on("message", async (task: MatchMessage) => {
  const { e1Config, e2Config, openingMoves, timeLimitMs } = task;

  // --- GAME 1: Engine 1 is White ---
  const e1_White = getEngineByName(e1Config.version, e1Config.depth);
  const e2_Black = getEngineByName(e2Config.version, e2Config.depth);
  const res1 = await playSingleGame(
    e1_White,
    e2_Black,
    openingMoves,
    timeLimitMs,
  );

  // --- GAME 2: Engine 1 is Black ---
  const e2_White = getEngineByName(e2Config.version, e2Config.depth);
  const e1_Black = getEngineByName(e1Config.version, e1Config.depth);
  const res2 = await playSingleGame(
    e2_White,
    e1_Black,
    openingMoves,
    timeLimitMs,
  );

  // Send results back to the Coordinator!
  parentPort?.postMessage({ res1, res2 });
});
