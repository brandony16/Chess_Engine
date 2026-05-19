import {
  BLACK_WIN,
  DRAW,
  WHITE_WIN,
  type Result,
} from "../../game/chessConstants.ts";
import {
  fetchOpenings,
  getRandomOpening,
  playOpeningMoves,
} from "./openings.ts";
import { mulberry32 } from "../../random.ts";
import type { EngineConfig } from "./matchWorker.ts";
import * as os from "os";
import { Worker } from "worker_threads";

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
  e1Config: EngineConfig,
  e2Config: EngineConfig,
  timeLimitMs: number,
): Promise<sprtResult> => {
  return new Promise(async (resolve) => {
    const openings = await fetchOpenings();
    const rng = mulberry32(16);

    const stats: Stats = { wins: 0, draws: 0, losses: 0 };
    let llr = 0;
    let gamesPlayed = 0;

    const NUM_CORES = os.cpus().length;
    const workers: Worker[] = [];
    let isFinished = false;

    // Helper to kill all threads when SPRT reaches a conclusion
    const terminateAll = (verdict: string) => {
      if (isFinished) return;
      isFinished = true;
      workers.forEach((w) => w.terminate());

      const rate = scoreRate(stats);
      resolve({
        verdict,
        ...stats,
        scoreRate: rate,
        eloDiff: eloFromScore(rate),
      });
    };

    const assignNextPair = async (worker: Worker) => {
      if (isFinished || gamesPlayed >= MAX_GAMES) {
        if (gamesPlayed >= MAX_GAMES) terminateAll("INCONCLUSIVE");
        return;
      }
      const gameSeed = Math.floor(rng() * 1e9);
      const openingMoves = await getRandomOpening(openings, gameSeed);
      worker.postMessage({ e1Config, e2Config, openingMoves, timeLimitMs });
    };

    console.log(`Starting SPRT across ${NUM_CORES} CPU cores...`);
    for (let i = 0; i < NUM_CORES; i++) {
      const workerPath = new URL("./matchWorker.ts", import.meta.url);
      const worker = new Worker(workerPath);

      worker.on("message", (msg: { res1: Result; res2: Result }) => {
        if (isFinished) return;
        const { res1, res2 } = msg;

        // Process Game 1 (E1 was White)
        llr = updateLLR(llr, res1, true);
        updateStats(stats, res1, true);

        // Process Game 2 (E1 was Black)
        llr = updateLLR(llr, res2, false);
        updateStats(stats, res2, false);

        gamesPlayed += 2;

        if (gamesPlayed % 10 === 0) {
          console.log(
            `Games: ${gamesPlayed} | W: ${stats.wins} D: ${stats.draws} L: ${stats.losses} | LLR: ${llr.toFixed(2)}`,
          );
        }

        // Check SPRT Bounds
        if (llr >= BOUNDS.upper) terminateAll("ACCEPTED");
        else if (llr <= BOUNDS.lower) terminateAll("REJECTED");
        else assignNextPair(worker); // give the worker the next set of games
      });

      workers.push(worker);

      // Kickstart the worker
      assignNextPair(worker);
    }
  });
};

function updateLLR(llr: number, result: Result, isE1White: boolean) {
  let score = 0.5; // Draw
  if (result === WHITE_WIN) score = isE1White ? 1 : 0;
  if (result === BLACK_WIN) score = isE1White ? 0 : 1;
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

function updateStats(stats: Stats, result: Result, isE1White: boolean) {
  if (result === DRAW) {
    stats.draws++;
    return;
  }
  const isE1Win =
    (result === WHITE_WIN && isE1White) || (result === BLACK_WIN && !isE1White);
  if (isE1Win) stats.wins++;
  else stats.losses++;
}
