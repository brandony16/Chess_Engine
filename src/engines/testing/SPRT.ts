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
import type { EngineConfig, MatchResponse } from "./matchWorker.ts";
import * as os from "os";
import { Worker } from "worker_threads";
import * as fs from "fs";

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

const MAX_PAIRS = 5_000;

export const sprt = async (
  e1Config: EngineConfig,
  e2Config: EngineConfig,
  timeLimitMs: number,
  maxNodes: number,
): Promise<sprtResult> => {
  return new Promise(async (resolve) => {
    const openings = await fetchOpenings();
    const rng = mulberry32(16);

    const stats: Stats = { wins: 0, draws: 0, losses: 0 };

    // Pentanomial tracking arrays [WW, WD, WL/DD, LD, LL]
    const penta = [0, 0, 0, 0, 0];
    let pairsPlayed = 0;

    let sumX = 0;
    let sumX2 = 0;
    let llr = 0;

    const NUM_CORES = os.cpus().length;
    const workers: Worker[] = [];
    let isFinished = false;

    // Helper to kill all threads when SPRT reaches a conclusion
    const terminateAll = (
      verdict: string,
      pgns: string[],
      e1AvgDepthTotal: number,
      e2AvgDepthTotal: number,
    ) => {
      if (isFinished) return;
      isFinished = true;
      workers.forEach((w) => w.terminate());

      console.log(
        `E1 Avg Search Depth: ${(e1AvgDepthTotal / pairsPlayed).toFixed(2)}\nE2 Avg Search Depth: ${(e2AvgDepthTotal / pairsPlayed).toFixed(2)}`,
      );
      const pgnOutput = pgns.join("\n\n");
      fs.writeFileSync("sprt_results.pgn", pgnOutput, "utf8");
      console.log("Saved all games to sprt_results.pgn");

      const rate = scoreRate(stats);
      resolve({
        verdict,
        ...stats,
        scoreRate: rate,
        eloDiff: eloFromScore(rate),
      });
    };

    const assignNextPair = async (
      worker: Worker,
      pgns: string[],
      e1AvgDepthTotal: number,
      e2AvgDepthTotal: number,
    ) => {
      if (isFinished || pairsPlayed >= MAX_PAIRS) {
        if (pairsPlayed >= MAX_PAIRS)
          terminateAll("INCONCLUSIVE", pgns, e1AvgDepthTotal, e2AvgDepthTotal);
        return;
      }
      const gameSeed = Math.floor(rng() * 1e9);
      const openingMoves = await getRandomOpening(openings, gameSeed);
      worker.postMessage({
        e1Config,
        e2Config,
        openingMoves,
        timeLimitMs,
        maxNodes,
      });
    };

    console.log(`Starting SPRT across ${NUM_CORES} CPU cores...`);
    const pgns: string[] = [];
    let e1AvgDepthTotal = 0;
    let e2AvgDepthTotal = 0;

    for (let i = 0; i < NUM_CORES; i++) {
      const workerPath = new URL("./matchWorker.ts", import.meta.url);
      const worker = new Worker(workerPath);

      worker.on("message", (msg: MatchResponse) => {
        if (isFinished) return;
        const { res1, res2, pgn1, pgn2, e1AvgDepth, e2AvgDepth } = msg;

        // for logging w/d/l at the end
        updateStats(stats, res1, true);
        updateStats(stats, res2, false);

        pgns.push(pgn1, pgn2);
        e1AvgDepthTotal += e1AvgDepth;
        e2AvgDepthTotal += e2AvgDepth;

        // Calculate Pentanomial Pair Score
        const s1 = getGameScore(res1, true); // E1 as White
        const s2 = getGameScore(res2, false); // E1 as Black

        const pairScore = s1 + s2; // Range: 0.0 to 2.0
        const x = pairScore / 2.0; // Normalized: 0.0 to 1.0

        if (pairScore === 2) penta[0]++;
        else if (pairScore === 1.5) penta[1]++;
        else if (pairScore === 1) penta[2]++;
        else if (pairScore === 0.5) penta[3]++;
        else penta[4]++;

        pairsPlayed++;
        sumX += x;
        sumX2 += x * x;

        if (pairsPlayed > 1) {
          const variance =
            (sumX2 - (sumX * sumX) / pairsPlayed) / (pairsPlayed - 1);

          if (variance > 0) {
            // Standard Pentanomial LLR Formula
            llr =
              ((p1 - p0) / variance) * (sumX - (pairsPlayed * (p0 + p1)) / 2);
          }
        }

        if (pairsPlayed % 25 === 0) {
          const gamesPlayed = pairsPlayed * 2;
          console.log(
            `Games: ${gamesPlayed} | W: ${stats.wins} D: ${stats.draws} L: ${stats.losses} | LLR: ${llr.toFixed(2)} | Penta ([WW, WD, WL/DD, LD, LL]): [${penta.join(", ")}]`,
          );
        }

        // Check SPRT Bounds
        if (llr >= BOUNDS.upper)
          terminateAll("ACCEPTED", pgns, e1AvgDepthTotal, e2AvgDepthTotal);
        else if (llr <= BOUNDS.lower)
          terminateAll("REJECTED", pgns, e1AvgDepthTotal, e2AvgDepthTotal);
        else assignNextPair(worker, pgns, e1AvgDepthTotal, e2AvgDepthTotal); // give the worker the next set of games
      });

      workers.push(worker);

      // Kickstart the worker
      assignNextPair(worker, pgns, e1AvgDepthTotal, e2AvgDepthTotal);
    }
  });
};

function getGameScore(result: Result, isE1White: boolean): number {
  if (result === DRAW) return 0.5;
  if (result === WHITE_WIN) return isE1White ? 1.0 : 0.0;
  if (result === BLACK_WIN) return isE1White ? 0.0 : 1.0;
  return 0.5; // fallback
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
