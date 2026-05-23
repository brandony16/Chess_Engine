import { moveToUCI } from "../../game/fenAndUCI/uciHelpers.ts";
import { Position } from "../../game/Position.ts";
import { BondmonkeyV15 } from "../bondmonkeyVersions/v15.ts";
import { SearchContext } from "../searchContext.ts";
// Import your engine search class/function here

type TestCase = {
  name: string;
  fen: string;
  expectedUci: string; // The winning move (e.g., "e4e5" or "Nf3")
  testDepth: number;   // The depth required to see the tactic
};

// A mini-suite of tactical puzzles to ensure LMR isn't blinding the engine
const testSuite: TestCase[] = [
  {
    name: "Back Rank Mate Threat",
    fen: "1k1r4/pp1b1R2/3q2pp/8/1P5Q/P7/B4PPP/6K1 b - - 0 1",
    expectedUci: "d6d1", // Black to move and mate
    testDepth: 6,
  },
  {
    name: "Discovered Attack",
    fen: "r1b2rk1/1pp1nppp/p1p5/8/3qP3/2N5/PPPB1PPP/R2Q1RK1 w - - 0 1",
    expectedUci: "c3d5", // White plays Nd5, attacking Queen and threatening Nxf6+
    testDepth: 6,
  },
  {
    name: "Knight Fork",
    fen: "r4rk1/pp1n1ppp/2p5/4Pb2/2B1p3/1P2P3/PB1K1PPP/R6R w - - 0 1",
    expectedUci: "e5e6", // e6 pushes pawn, opening the fork
    testDepth: 6,
  }
];

export async function runTestSuite() {
  console.log("Starting Tactical Test Suite...");
  
  let totalNodes = 0;
  let passed = 0;

  for (const test of testSuite) {
    const pos = new Position();
    pos.loadFen(test.fen);
    
    const ctx = new SearchContext(Infinity, Infinity); 
    
    const engine = new BondmonkeyV15(test.testDepth);
    
    // Force the engine to search exactly to the testDepth
    const startTime = performance.now();

    const bestMove = engine.search(pos, ctx);
    const bestMoveUci = moveToUCI(bestMove);
    
    const timeTaken = performance.now() - startTime;
    totalNodes += ctx.nodesSearched;

    if (bestMoveUci === test.expectedUci) {
      passed++;
      console.log(`[PASS] ${test.name} | Nodes: ${ctx.nodesSearched} | Time: ${timeTaken}ms`);
    } else {
      console.log(`[FAIL] ${test.name} | Expected: ${test.expectedUci}, Got: ${bestMoveUci}`);
    }
  }

  console.log("\n--- TEST SUITE RESULTS ---");
  console.log(`Score: ${passed} / ${testSuite.length}`);
  console.log(`Total Nodes: ${totalNodes.toLocaleString()}`);
  
  if (passed === testSuite.length) {
    console.log("Verdict: LMR is SAFE! Compare total nodes to previous version.");
  } else {
    console.log("Verdict: LMR is TOO AGGRESSIVE. Tune back reductions.");
  }
}

runTestSuite();