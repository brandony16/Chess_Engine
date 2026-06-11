import {
  BLACK_WIN,
  DRAW,
  WHITE_WIN,
  type Result,
} from "../../game/chessConstants.ts";
import { fetchOpenings, getRandomOpening } from "./openings.ts";
import { mulberry32 } from "../../random.ts";
import * as os from "os";
import type {
  EngineConfig,
  MatchMessage,
  MatchResponse,
} from "./matchWorker.ts";
import { Worker } from "worker_threads";
import * as fs from "fs";
import type { ClockType } from "../searchContext.ts";

type MatchResult = {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  score: number;
};
export const runMatch = async (
  e1Config: EngineConfig,
  e2Config: EngineConfig,
  numGames: number,
  clockSettings: ClockType,
  seed: number = 1,
): Promise<MatchResult> => {
  return new Promise(async (resolve) => {
    const openings = await fetchOpenings();
    const rng = mulberry32(seed);

    const res: MatchResult = {
      games: numGames,
      wins: 0,
      losses: 0,
      draws: 0,
      score: 0,
    };

    // We play games in pairs (E1 as White, E1 as Black)
    const targetPairs = Math.ceil(numGames / 2);
    let pairsDispatched = 0;
    let pairsCompleted = 0;

    const NUM_CORES = os.cpus().length - 1;
    const workers: Worker[] = [];

    console.log(
      `Starting ${numGames} game match across ${NUM_CORES} CPU cores...`,
    );

    // Helper to record the result from E1's perspective
    const recordResult = (result: Result, isE1White: boolean) => {
      if (result === DRAW) {
        res.draws++;
        return;
      }
      const isE1Win =
        (result === WHITE_WIN && isE1White) ||
        (result === BLACK_WIN && !isE1White);
      if (isE1Win) res.wins++;
      else res.losses++;
    };

    // Helper to shut everything down and return the final object
    const terminateAll = (
      pgns: string[],
      e1AvgDepthTotal: number,
      e2AvgDepthTotal: number,
    ) => {
      workers.forEach((w) => w.terminate());
      res.score = res.wins + 0.5 * res.draws;
      console.log(`\nMatch Complete! Score: ${res.score} / ${res.games}`);
      console.log(
        `Wins: ${res.wins} | Draws: ${res.draws} | Losses: ${res.losses}`,
      );
      console.log(
        `E1 Avg Search Depth: ${(e1AvgDepthTotal / pairsCompleted).toFixed(2)}\nE2 Avg Search Depth: ${(e2AvgDepthTotal / pairsCompleted).toFixed(2)}`,
      );

      const pgnOutput = pgns.join("\n\n");
      fs.writeFileSync("match_results.pgn", pgnOutput, "utf8");
      console.log("Saved all games to match_results.pgn");

      resolve(res);
    };

    // Helper to send the next task to a free worker
    const assignNextPair = async (worker: Worker) => {
      if (pairsDispatched >= targetPairs) {
        // No more games to give out!
        return;
      }

      pairsDispatched++;
      const gameSeed = Math.floor(rng() * 1e9);
      const openingMoves = await getRandomOpening(openings, gameSeed);

      const message: MatchMessage = {
        e1Config,
        e2Config,
        openingMoves,
        clockSettings,
      };

      worker.postMessage(message);
    };

    const pgns: string[] = [];
    let e1AvgDepthTotal = 0;
    let e2AvgDepthTotal = 0;

    // --- INITIALIZE WORKER POOL ---
    for (let i = 0; i < NUM_CORES; i++) {
      // Safely resolve the path based on the current file
      const workerPath = new URL("./matchWorker.ts", import.meta.url);
      const worker = new Worker(workerPath);

      worker.on("message", (msg: MatchResponse) => {
        const { res1, res2, pgn1, pgn2, e1AvgDepth, e2AvgDepth } = msg;

        recordResult(res1, true); // Game 1: E1 was White
        recordResult(res2, false); // Game 2: E1 was Black

        pgns.push(pgn1, pgn2);
        e1AvgDepthTotal += e1AvgDepth;
        e2AvgDepthTotal += e2AvgDepth;

        pairsCompleted++;

        // Status update
        if (pairsCompleted % 5 === 0) {
          const gamesFinished = pairsCompleted * 2;
          console.log(
            `Progress: ${gamesFinished}/${numGames} games played. Score: ${res.wins + 0.5 * res.draws}`,
          );
        }

        // Check if the match is entirely finished
        if (pairsCompleted >= targetPairs) {
          terminateAll(pgns, e1AvgDepthTotal, e2AvgDepthTotal);
        } else {
          // Worker is free, give it another pair!
          assignNextPair(worker);
        }
      });

      worker.on("error", (err) => {
        console.error("Worker Error:", err);
      });

      workers.push(worker);

      // Kickstart the worker with its first task
      assignNextPair(worker);
    }
  });
};
