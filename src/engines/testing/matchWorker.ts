import { parentPort } from "worker_threads";
import { Position } from "../../game/Position.ts";
import { SearchContext } from "../searchContext.ts";
import { playOpeningMoves } from "./openings.ts";
import { DRAW, type Result } from "../../game/chessConstants.ts";
import {
  getEngineByName,
  type EngineName,
} from "../bondmonkeyVersions/engineList.ts";
import type { Bondmonkey } from "../bondmonkeyVersions/type.ts";
import { MinimaxV8 } from "../minimaxEngines/v8.ts";
import { evaluateV4 } from "../evaluation/evaluationv4.ts";
import { buildPGNFromEngineGame } from "../../game/fenAndUCI/pgn.ts";

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
  maxNodes: number,
) {
  const pos = new Position();
  const MAX_PLY = 512;

  white.newGame();
  black.newGame();

  await playOpeningMoves(openingMoves, pos);
  const ctx = new SearchContext(maxNodes, timeLimitMs);

  const moveList = [];

  let whiteDepthReachedTotal = 0;
  let blackDepthReachedTotal = 0;
  let numWhiteMoves = 0;
  let numBlackMoves = 0;
  while (!pos.gameOver() && pos.fullmoveNumber * 2 < MAX_PLY) {
    ctx.reset(maxNodes, timeLimitMs);
    const whiteMove = white.search(pos, ctx);

    moveList.push(whiteMove);
    whiteDepthReachedTotal += white.depthOfPrevSearch;
    numWhiteMoves++;

    pos.makeMove(whiteMove);

    pos.checkGameOver();
    if (pos.gameOver()) break;

    ctx.reset(maxNodes, timeLimitMs);
    const blackMove = black.search(pos, ctx);

    moveList.push(blackMove);
    blackDepthReachedTotal += black.depthOfPrevSearch;
    numBlackMoves++;

    pos.makeMove(blackMove);

    pos.checkGameOver();
  }

  const result: Result = pos.fullmoveNumber * 2 >= MAX_PLY ? DRAW : pos.result;

  const pgn = buildPGNFromEngineGame(openingMoves, moveList, {
    white: white.name,
    black: black.name,
    result,
  });

  const wAvgDepth = whiteDepthReachedTotal / numWhiteMoves;
  const bAvgDepth = blackDepthReachedTotal / numBlackMoves;

  return { result, pgn, wAvgDepth, bAvgDepth };
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
  maxNodes: number;
};

export type MatchResponse = {
  res1: Result;
  res2: Result;
  pgn1: string;
  pgn2: string;
  e1AvgDepth: number;
  e2AvgDepth: number;
};

parentPort?.on("message", async (task: MatchMessage) => {
  const { e1Config, e2Config, openingMoves, timeLimitMs, maxNodes } = task;

  // --- GAME 1: Engine 1 is White ---
  const g1_White = getEngineByName(e1Config.version, e1Config.depth);
  const g1_Black = getEngineByName(e2Config.version, e2Config.depth);
  const gameRes1 = await playSingleGame(
    g1_White,
    g1_Black,
    openingMoves,
    timeLimitMs,
    maxNodes,
  );

  // --- GAME 2: Engine 1 is Black ---
  const g2_White = getEngineByName(e2Config.version, e2Config.depth);
  const g2_Black = getEngineByName(e1Config.version, e1Config.depth);
  const gameRes2 = await playSingleGame(
    g2_White,
    g2_Black,
    openingMoves,
    timeLimitMs,
    maxNodes,
  );

  const e1AvgDepth = (gameRes1.wAvgDepth + gameRes2.bAvgDepth) / 2;
  const e2AvgDepth = (gameRes1.bAvgDepth + gameRes2.wAvgDepth) / 2;

  const res: MatchResponse = {
    res1: gameRes1.result,
    res2: gameRes2.result,
    pgn1: gameRes1.pgn,
    pgn2: gameRes2.pgn,
    e1AvgDepth,
    e2AvgDepth,
  };

  // Send results back
  parentPort?.postMessage(res);
});
