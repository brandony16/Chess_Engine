import * as readline from "readline";
import { Position } from "../game/Position.ts";
import {
  engineNames,
  getEngineByName,
} from "../engines/bondmonkeyVersions/engineList.ts";
import {
  ContextType,
  SearchContext,
  type ClockType,
} from "../engines/searchContext.ts";
import { OpeningBook } from "../OpeningBook.ts";
import { START_POS } from "../__tests__/game_tests/fens.ts";
import * as fs from "fs";
import * as path from "path";
import { moveToUCI, uciToMove } from "../game/fenAndUCI/uciHelpers.ts";
import { WHITE } from "../game/chessConstants.ts";
import { MAX_SEARCH_PLY } from "../engines/Engine.ts";

const bookPath = path.resolve("./public/openings.json");

const rawData = fs.readFileSync(bookPath, "utf-8");
const bookData = JSON.parse(rawData);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

let pos = new Position();
const engine = getEngineByName(engineNames[0], MAX_SEARCH_PLY);
let currentUciHistory: string[] = [];

const openingBook = new OpeningBook();
openingBook.initialize(bookData);

console.log("Bondmonkey UCI bridge started.");

rl.on("line", async (line: string) => {
  const tokens = line.trim().split(" ");
  const command = tokens[0];

  switch (command) {
    case "uci":
      // Identify the engine to the GUI
      console.log("id name Bondmonkey");
      console.log("id author Brandon");
      console.log("uciok");
      break;

    case "isready":
      console.log("readyok");
      break;

    case "ucinewgame":
      // Reset internal board and history for a new match
      pos.loadFen(START_POS);
      engine.newGame();
      break;

    case "position":
      // Update the board state
      handlePosition(tokens);
      break;

    case "go":
      // Start calculating and return the best move
      handleGo(tokens);
      break;

    case "quit":
      // 6. Shut down
      process.exit(0);

    default:
      // Ignore unknown commands quietly (standard UCI behavior)
      break;
  }
});

// --- HELPER FUNCTIONS ---

function handlePosition(tokens: string[]) {
  pos = new Position();
  let moveStartIndex = -1;
  currentUciHistory = []; // Reset history

  // 1. Setup the initial board state
  if (tokens[1] === "startpos") {
    pos.loadFen(START_POS);
    moveStartIndex = tokens.indexOf("moves");
  } else if (tokens[1] === "fen") {
    // FEN strings contain spaces, so they are broken into multiple tokens.
    // We need to stitch tokens 2 through 7 back together.
    const fenTokens = [];
    let i = 2;
    while (i < tokens.length && tokens[i] !== "moves") {
      fenTokens.push(tokens[i]);
      i++;
    }
    const fen = fenTokens.join(" ");
    pos.loadFen(fen);
    moveStartIndex = tokens.indexOf("moves");
  }

  if (moveStartIndex !== -1) {
    currentUciHistory = tokens.slice(moveStartIndex + 1);

    for (const uciMove of currentUciHistory) {
      const move = uciToMove(uciMove, pos);
      pos.makeMove(move);
      pos.searchPly = 0;
    }
  }
}

function handleGo(tokens: string[]) {
  // Determine whose turn it is so we grab the right clock times
  const isWhite = pos.sideToMove === WHITE;

  let wtime = 0,
    btime = 0,
    winc = 0,
    binc = 0;
  let movetime = 0;

  // Extract the time variables from the token array
  for (let i = 1; i < tokens.length; i++) {
    switch (tokens[i]) {
      case "wtime":
        wtime = parseInt(tokens[++i], 10);
        break;
      case "btime":
        btime = parseInt(tokens[++i], 10);
        break;
      case "winc":
        winc = parseInt(tokens[++i], 10);
        break;
      case "binc":
        binc = parseInt(tokens[++i], 10);
        break;
      case "movetime":
        movetime = parseInt(tokens[++i], 10);
        break;
    }
  }

  // Build the ClockType for your SearchContext
  let clockType: ClockType;

  if (movetime > 0) {
    // The GUI wants us to search for an exact amount of time
    clockType = { type: ContextType.FIXED_TIME, maxTimeMs: movetime };
  } else if (wtime > 0 || btime > 0) {
    // Standard tournament time control
    clockType = {
      type: ContextType.TIME_CONTROL,
      timePerPlayer: isWhite ? wtime : btime,
      increment: isWhite ? winc : binc,
    };
  } else {
    // Fallback: If GUI sends bare "go", search for 5 seconds so it doesn't hang forever
    clockType = { type: ContextType.FIXED_TIME, maxTimeMs: 5000 };
  }

  if (pos.ply < 8) {
    const bookMove = openingBook.getBookMove(currentUciHistory);
    if (bookMove !== null) {
      console.log(`bestmove ${bookMove}`);
      return;
    }
  }

  // Initialize the SearchContext with the time limits and phase multipliers
  const searchContext = new SearchContext(clockType);
  searchContext.startSearch(pos.ply);

  const bestMove = engine.search(pos, searchContext);

  // Output the final result to the GUI
  const uciMoveString = moveToUCI(bestMove);
  console.log(`bestmove ${uciMoveString}`);
}
