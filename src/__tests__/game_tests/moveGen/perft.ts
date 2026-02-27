import { moveToUCI } from "../../../game/fenAndUCI/uciHelpers.ts";
import type { Position } from "../../../game/Position.ts";

/**
 * Count leaf nodes to `depth` by recursively generating, making, and unmaking moves.
 */
export function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1;

  let nodes = 0;
  const moves = pos.generateLegalMoves();

  // No need to sim every move if at the end
  if (depth === 1) {
    return moves.length;
  }
  for (const move of moves) {
    pos.makeMove(move);

    nodes += perft(pos, depth - 1);

    pos.unmakeMove();
  }

  return nodes;
}

export function perftDivide(pos: Position, depth: number): {} {
  const divide = {};

  const moves = pos.generateLegalMoves();

  for (const move of moves) {
    const uci = moveToUCI(move);
    pos.makeMove(move);

    divide[uci] = perft(pos, depth - 1);

    pos.unmakeMove();
  }

  return divide;
}
