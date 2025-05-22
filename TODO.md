## UI

- Make pieces draggable
- Organize sidebar by making buttons on the same row and using icons (maybe?)
- Add ability to flip the board view
- (maybe) add ability to change the color of the board. Maybe have different
  themes?
- Make it so clicking on the most recent move allows you to make a move

## Engine
- Add imcremental attack map updates instead of complete recalculation
- Add 50 move rule to engine sim

## General

- Find a way to test my functions robustly
- Optimize functions further


## Testing
Integration Testing
Perft Testing
Perft suite: implement a recursive node-count (perft(depth)) that only counts legal moves and compare leaf-node totals at depths 1–5 against known values from a Perft table (e.g., perft(5) = 4,865,609 from the standard start). 

Automated diff: use tools like perftree to compare your engine’s perft output to Stockfish and pinpoint exactly which subtrees diverge. 

Teacher-student perft: consider Python scripts like AutoPerft that run your engine vs. a strong reference in lockstep, highlighting missing or extra moves. 

Search & Evaluation
Search invariants: write tests asserting that a zero-depth search returns the static evaluation of the current position, and that deeper alpha-beta searches don’t exceed legal bounds. 

Snapshot search paths: for fixed positions, capture the principal variation (PV) at a shallow depth and assert it remains stable unless you intentionally change your evaluation heuristics. 

Property-Based Testing
Invariants over random positions: use fast-check to generate random legal FENs (or mutate known positions) and assert properties such as “makeMove then unMakeMove yields original board” or “the number of white pieces ≥ 0 and ≤ 16.” 

FEN parser robustness: property-test that parsing any syntactically valid FEN string does not throw and always produces a board where generateLegalMoves() returns ≥ 0 moves. 

Evaluation bounds: fuzz test your evaluation function to ensure it always returns within a specified integer range (e.g., –∞ < score < +∞ but within, say, ±10,000 centipawns). 

Coverage & Continuous Integration
Test coverage: integrate Istanbul/nyc to measure statement, branch, and function coverage, aiming for near-100% on critical modules (moveGenerator.js, search.js, board.js). 

Automate with CI: configure your CI (GitHub Actions, Travis CI, etc.) to run your full test suite—including unit, perft, and property-based tests—on every push, blocking merges on coverage or test regressions.


## FUNCTIONS TO TEST
- getQuiescenceMoves
- getNewEnPassant
- updateCastlingRights
- updateHash
- 