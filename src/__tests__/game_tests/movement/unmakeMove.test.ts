import { describe } from "vitest";
import type { Position } from "../../../game/Position.ts";

function areEqual(pos1: Position, pos2: Position): boolean {
  // Zobrist covers pieces, sideToMove, castling, and en passant
  if (pos1.zobristKey !== pos2.zobristKey) {
    return false;
  }

  if (pos1.result !== pos2.result) {
    return false;
  }
  if (pos1.endState !== pos2.endState) {
    return false;
  }
  if (pos1.halfmoveClock !== pos2.halfmoveClock) {
    return false;
  }
  if (pos1.fullmoveNumber !== pos2.fullmoveNumber) {
    return false;
  }

  return true;
}

describe("unmakeMove - movement", () => {});

describe("unmakeMove - captures", () => {});

describe("unmakeMove - promotions", () => {});
