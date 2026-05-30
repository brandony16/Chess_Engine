import { describe, expect, it } from "vitest";
import { uciToMove } from "../../../game/fenAndUCI/uciHelpers.ts";
import { Position } from "../../../game/Position.ts";
import { evaluateV4 } from "../../../engines/evaluation/evaluationv4.ts";
import { DEFAULT_EVAL_WEIGHTS } from "../../../engines/evaluation/Evaluation.ts";
import { MAX_SEARCH_PLY } from "../../../engines/Engine.ts";
import EvaluationV5 from "../../../engines/evaluation/evalModules/v5.ts";

const testPGN =
  "1. e2e4 e7e6 2. d2d4 d7d5 3. b1d2 a7a6 4. g1f3 c7c5 5. f3e5 c5d4 6. c2c3 d4c3 7. b2c3 d8c7 8. d1a4 b7b5 9. f1b5 a6b5 10. a4a8 c8b7 11. a8b7 c7b7 12. e4d5 f8d6 13. e5f3 b7d5 14. c1b2 g8f6 15. e1g1 e8g8 16. d2b3 f6e4 17. a1d1 d5a8 18. b3d2 e4d2 19. d1d2 d6f4 20. d2d4 a8a2 21. d4b4 b8c6 22. b4b5 h7h6 23. f1e1 a2c4 24. b5b7 e6e5 25. b7d7 e5e4 26. f3d4 c6e5 27. d7e7 c4c5 28. e7b7 e5g4 29. g2g3 f4e5 30. h2h3 e5d4 31. c3d4 c5c6 32. b2a3 f8a8 33. e1b1 g4f2 34. b7b8 g8h7 35. b8a8 c6a8 36. a3c1 e4e3 37. c1e3 f2h3 38. g1h2 a8a2 39. h2h3 a2b1 40. h3g2 b1d1 41. e3f2 h7g6 42. f2e3 d1e2 43. e3f2 g6f5 44. g2g1 f5g4 45. g1g2 e2d3 46. f2e1 d3d4 47. g2f1 g4f3 48. g3g4 d4b2 49. e1h4 b2g2 50. f1e1 g2e2";

const moveList = (pgn: string) => {
  const parts = pgn.split(" ");
  const list = [];
  const pos = new Position();
  for (let i = 0; i < MAX_SEARCH_PLY; i++) {
    const part = parts[i];
    if (part.includes(".")) continue; // is a move number
    const move = uciToMove(part, pos);
    pos.makeMove(move);
    list.push(move);
  }
  return list;
};

describe("incremental scores are the same as fully calculated scores", () => {
  it("is equal over a full game", () => {
    const pos = new Position();
    const incrementalEval = new EvaluationV5();
    incrementalEval.initializeEval(pos);

    expect(incrementalEval.getEval(pos)).toEqual(
      evaluateV4(pos, DEFAULT_EVAL_WEIGHTS),
    );

    const moves = moveList(testPGN);
    for (const move of moves) {
      incrementalEval.makeMoveUpdateEval(move, pos.searchPly, pos.sideToMove);
      pos.makeMove(move);

      expect(incrementalEval.getEval(pos)).toEqual(
        evaluateV4(pos, DEFAULT_EVAL_WEIGHTS),
      );
    }
    for (const move of moves.reverse()) {
      pos.unmakeMove();
      incrementalEval.restoreEval(pos.searchPly);

      expect(incrementalEval.getEval(pos)).toEqual(
        evaluateV4(pos, DEFAULT_EVAL_WEIGHTS),
      );
    }
  });
});
