import { NO_PIECE, PIECE_N, PIECES } from "../../game/chessConstants.ts";
import {
  moveCaptured,
  movePiece,
  movePromotion,
  moveTo,
  type Move,
} from "../../game/moveMaking/move.ts";
import { pieceType } from "../evaluation/Evaluation.ts";

const ORDERING_VALUES = [0, 1, 3, 3, 5, 9, 100];

// Score each move for ordering
export function scoreMoveForOrderingBasic(move: Move): number {
  let total = 0;
  const captured = moveCaptured(move);

  // Captures first, ordered by MVV-LVA
  // (Most Valuable Victim - Least Valuable Attacker)
  if (captured !== NO_PIECE) {
    total += MVV_LVA[captured * PIECE_N + movePiece(move)] + 1_000_000;
  }

  // Promotions
  const promo = movePromotion(move);
  if (promo !== NO_PIECE) {
    total += ORDERING_VALUES[promo] + 900_000;
  }

  return total;
}

export function scoreMoveForOrderingWithTT(move: Move, ttMove: Move): number {
  let total = 0;
  const captured = moveCaptured(move);

  // Always do TT move first
  if (move === ttMove) {
    total += 10_000_000;
  }

  // Captures next, ordered by MVV-LVA
  // (Most Valuable Victim - Least Valuable Attacker)
  if (captured !== NO_PIECE) {
    total += MVV_LVA[captured * PIECE_N + movePiece(move)] + 100_000;
  }

  // Promotions
  const promo = movePromotion(move);
  if (promo !== NO_PIECE) {
    total += ORDERING_VALUES[promo] + 90_000;
  }

  return total;
}

export function scoreMoveForOrderingKiller(
  move: Move,
  ttMove: Move,
  ply: number,
  killerMoves: Uint32Array[],
  historyTable: Int32Array[],
): number {
  const captured = moveCaptured(move);

  // Always do TT move first
  if (move === ttMove) {
    return 10_000_000;
  }

  let total = 0;

  // Captures next, ordered by MVV-LVA
  // (Most Valuable Victim - Least Valuable Attacker)
  if (captured !== NO_PIECE) {
    total += MVV_LVA[captured * PIECE_N + movePiece(move)] + 100_000;
  }

  // Promotions
  const promo = movePromotion(move);
  if (promo !== NO_PIECE) {
    total += ORDERING_VALUES[promo] + 90_000;
  }

  if (promo !== NO_PIECE || captured !== NO_PIECE) {
    return total;
  }

  if (killerMoves[ply][0] === move) {
    return 80_000;
  } else if (killerMoves[ply][1] === move) {
    return 70_000;
  }

  const piece = movePiece(move);
  const toSq = moveTo(move);

  // Cap the history score to ensure it never overrides a killer move or capture
  // Even if a square is historically great, a verified killer move is more urgent
  return Math.min(historyTable[piece][toSq], 50_000);
}

// MVV-LVA table: indexed by [victim][attacker]
// Higher = search first
export const MVV_LVA = new Int32Array(PIECE_N * PIECE_N);

for (const victim of PIECES) {
  for (const attacker of PIECES) {
    // multiple by 10 so every capture is positive and searched before quiet moves
    MVV_LVA[victim * PIECE_N + attacker] =
      ORDERING_VALUES[pieceType(victim)] * 10 -
      ORDERING_VALUES[pieceType(attacker)];
  }
}
