import fs from "fs";
import path from "path";
import { Chess } from "chess.js";

// CONFIG
const PGN_PATH = path.resolve("masters.pgn");
const OUT_PATH = path.resolve("openings.json");
const MAX_PLY = 8; // number of half-moves per line
const MAX_LINES = 20000; // cap total lines

/**
 * Shuffles an array using a Fisher-Yates shuffle.
 *
 * @param {Array} array - the array to shuffle
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

(async function build() {
  console.log("Reading PGN…");
  const raw = fs.readFileSync(PGN_PATH, "utf8");
  const games = raw
    .split(/(?=\[Event )/)
    .map((game) => game.trim())
    .filter((game) => game.length > 0);

  const lines = [];

  console.log(`Parsing ${games.length} games…`);
  for (const rawPgn of games) {
    const chess = new Chess();
    chess.loadPgn(rawPgn, { sloppy: true });

    const moves = chess.history({ verbose: true });
    if (moves.length < MAX_PLY) continue;

    // build UCI line: ["e2e4", "e7e5", ...]
    const uciLine = moves
      .slice(0, MAX_PLY)
      .map((m) => m.from + m.to + (m.promotion || ""));

    lines.push(uciLine);
  }

  console.log(`Shuffling and trimming to ${MAX_LINES} lines…`);
  shuffle(lines);
  const output = lines.slice(0, MAX_LINES);

  console.log(`Writing ${output.length} lines to ${OUT_PATH}`);
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), "utf8");

  console.log("Done!");
})();
