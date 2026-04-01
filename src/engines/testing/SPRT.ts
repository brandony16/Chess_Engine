import { DRAW, WHITE_WIN, type Result } from "../../game/chessConstants.ts";
import { Position } from "../../game/Position.ts";
import type { Engine } from "../Engine.ts";
import {
  fetchOpenings,
  getRandomOpening,
  playOpeningMoves,
} from "./openings.ts";
import { mulberry32 } from "../../random.ts";
import { SearchContext } from "../searchContext.ts";

type Stats = {
  wins: number;
  draws: number;
  losses: number;
};

type sprtBounds = {
  lower: number;
  upper: number;
};

type sprtResult = {
  verdict: string;
  wins: number;
  draws: number;
  losses: number;
  scoreRate: number;
  eloDiff: number;
};

const H0_ELO = 0; // null hypothesis
const H1_ELO = 5; // improvement hypothesis

const p0 = eloToScore(H0_ELO);
const p1 = eloToScore(H1_ELO);

const ALPHA = 0.05; // false positive rate
const BETA = 0.05; // false negative rate

const BOUNDS: sprtBounds = {
  lower: Math.log(BETA / (1 - ALPHA)),
  upper: Math.log((1 - BETA) / ALPHA),
};

const MAX_GAMES = 1000;

export const sprt = async (
  engine1: Engine,
  engine2: Engine,
  nodeLimit: number,
): Promise<sprtResult> => {
  const openings = await fetchOpenings();
  const stats: Stats = {
    wins: 0,
    draws: 0,
    losses: 0,
  };

  const rng = mulberry32(16);

  const buildResult = (verdict: string, stats: Stats): sprtResult => {
    const rate = scoreRate(stats);
    return {
      verdict: verdict,
      ...stats,
      scoreRate: rate,
      eloDiff: eloFromScore(rate),
    };
  };

  let llr = 0;
  let games = 0;
  while (games < MAX_GAMES) {
    if (games % 50 === 0) {
      console.log(
        `Game ${games} started.\nStats: ${stats.wins} wins - ${stats.draws} draws - ${stats.losses} losses`,
      );
    }
    const gameSeed = Math.floor(rng() * 1e9);
    const openingMoves = await getRandomOpening(openings, gameSeed);

    // Each engine plays the same opening with white and black
    const result1 = await playSingleGame(
      engine1,
      engine2,
      openingMoves,
      nodeLimit,
    );

    llr = updateLLR(llr, result1, engine1, engine1);
    updateStats(stats, result1, engine1, engine2, engine1);

    if (llr >= BOUNDS.upper) return buildResult("ACCEPTED", stats);
    if (llr <= BOUNDS.lower) return buildResult("REJECTED", stats);

    const result2 = await playSingleGame(
      engine2,
      engine1,
      openingMoves,
      nodeLimit,
    );

    llr = updateLLR(llr, result2, engine2, engine1);
    updateStats(stats, result2, engine2, engine1, engine1);

    if (llr >= BOUNDS.upper) return buildResult("ACCEPTED", stats);
    if (llr <= BOUNDS.lower) return buildResult("REJECTED", stats);

    games += 2;
  }

  return buildResult("INCONCLUSIVE", stats);
};

async function playSingleGame(
  white: Engine,
  black: Engine,
  openingMoves: string[],
  nodeLimit: number,
): Promise<Result> {
  const pos = new Position();
  const MAX_PLY = 512;

  white.newGame();
  black.newGame();

  await playOpeningMoves(openingMoves, pos);

  const ctx = new SearchContext(nodeLimit);
  while (!pos.gameOver() && pos.fullmoveNumber * 2 < MAX_PLY) {
    ctx.reset(nodeLimit);
    const whiteMove = white.search(pos, ctx);
    pos.makeMove(whiteMove);

    pos.checkGameOver();
    if (pos.gameOver()) break;
    ctx.reset(nodeLimit);

    const blackMove = black.search(pos, ctx);
    pos.makeMove(blackMove);

    pos.checkGameOver();
  }

  if (pos.fullmoveNumber * 2 >= MAX_PLY) {
    return DRAW;
  }

  return pos.result;
}

function updateLLR(
  llr: number,
  result: Result,
  white: Engine,
  engine1: Engine,
) {
  const score =
    result === DRAW
      ? 0.5
      : result === WHITE_WIN
        ? white === engine1
          ? 1
          : 0
        : white === engine1
          ? 0
          : 1;

  return llr + Math.log(scoreProb(score, p1) / scoreProb(score, p0));
}

function scoreProb(score: number, p: number) {
  if (score === 1) return p;
  if (score === 0) return 1 - p;
  return 0.5; // draw approximation
}

function eloFromScore(score: number) {
  return -400 * Math.log10(1 / score - 1);
}

function eloToScore(elo: number) {
  return 1 / (1 + Math.pow(10, -elo / 400));
}

function scoreRate(stats: Stats): number {
  const total = stats.wins + stats.losses + stats.draws;
  const score = stats.wins + 0.5 * stats.draws;
  return score / total;
}

function updateStats(
  stats: Stats,
  result: Result,
  white: Engine,
  black: Engine,
  engine1: Engine,
) {
  if (result === DRAW) {
    stats.draws++;
    return;
  }

  const winner = result === WHITE_WIN ? white : black;

  if (winner === engine1) stats.wins++;
  else stats.losses++;
}
