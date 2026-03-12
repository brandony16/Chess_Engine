import { moveToUCI } from "../../../game/fenAndUCI/uciHelpers.ts";
import { MAX_MOVES, type Position } from "../../../game/Position.ts";

/**
 * Count leaf nodes to `depth` by recursively generating, making, and unmaking moves.
 */
export function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1;

  let nodes = 0;
  const start = pos.searchPly * MAX_MOVES;
  const moveCount = pos.generateLegalMoves();

  // No need to sim every move if at the end
  if (depth === 1) {
    return moveCount;
  }
  for (let i = 0; i < moveCount; i++) {
    const move = pos.moveBuffer[start + i];

    pos.makeMove(move);

    nodes += perft(pos, depth - 1);

    pos.unmakeMove();
  }

  return nodes;
}

export function perftDivide(
  pos: Position,
  depth: number,
): Record<string, number> {
  const divide: Record<string, number> = {};

  pos.searchPly = 0;
  const moveCount = pos.generateLegalMoves();

  for (let i = 0; i < moveCount; i++) {
    const move = pos.moveBuffer[i];

    const uci = moveToUCI(move);
    pos.makeMove(move);

    divide[uci] = perft(pos, depth - 1);

    pos.unmakeMove();
  }

  return divide;
}
