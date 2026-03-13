import { bigIntFullRep } from "../../../debugFunctions.ts";
import { moreThanOne } from "../../../game/attackMasks/checkersAndPinned.ts";
import { moveToUCI } from "../../../game/fenAndUCI/uciHelpers.ts";
import { MAX_MOVES, type Position } from "../../../game/Position.ts";

/**
 * Count leaf nodes to `depth` by recursively generating, making, and unmaking moves.
 */
export function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1;

  let nodes = 0;
  const start = pos.searchPly * MAX_MOVES;
  const moveCount = pos.generatePseudoLegalMoves();

  const checkers = pos.getCheckers();
  const pinned = pos.getPinnedPieces();
  const inDoubleCheck = moreThanOne(checkers);

  for (let i = 0; i < moveCount; i++) {
    const move = pos.moveBuffer[start + i];

    if (!pos.isLegal(move, checkers, pinned, inDoubleCheck)) continue;

    pos.makeMove(move);

    if (depth === 1) {
      nodes++;
    } else {
      nodes += perft(pos, depth - 1);
    }
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
  const moveCount = pos.generatePseudoLegalMoves();

  const checkers = pos.getCheckers();
  const pinned = pos.getPinnedPieces();
  const inDoubleCheck = moreThanOne(checkers);

  for (let i = 0; i < moveCount; i++) {
    const move = pos.moveBuffer[i];

    if (!pos.isLegal(move, checkers, pinned, inDoubleCheck)) continue;

    const uci = moveToUCI(move);
    pos.makeMove(move);

    divide[uci] = perft(pos, depth - 1);

    pos.unmakeMove();
  }

  return divide;
}
