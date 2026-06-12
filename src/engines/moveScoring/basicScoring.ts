import { NO_PIECE, PIECE_N, PIECES } from "../../game/chessConstants.ts";
import {
  moveCaptured,
  movePiece,
  movePromotion,
  moveTo,
  type Move,
} from "../../game/moveMaking/move.ts";
import type { Position } from "../../game/Position.ts";
import { pieceType } from "../evaluation/Evaluation.ts";
import { see } from "../see.ts";

const ORDERING_VALUES = [0, 1, 3, 3, 5, 9, 100, 1, 3, 3, 5, 9, 100];

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

export function scoreMoveKiller(
  move: Move,
  ply: number,
  killerMoves: Uint32Array[],
  ttMove: Move = 0,
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
    total += ORDERING_VALUES[promo] + 100_000;
  }

  if (promo !== NO_PIECE || captured !== NO_PIECE) {
    return total;
  }

  // quiet moves only now
  if (killerMoves[ply][0] === move) {
    return 80_000;
  } else if (killerMoves[ply][1] === move) {
    return 70_000;
  }

  return 0;
}

export function scoreMoveWithHeuristics(
  move: Move,
  ply: number,
  killerMoves: Uint32Array[],
  historyTable: Uint32Array[],
  hashMove: Move = 0,
): number {
  const captured = moveCaptured(move);

  // Always do TT move first
  if (move === hashMove) {
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
    total += ORDERING_VALUES[promo] + 100_000;
  }

  if (promo !== NO_PIECE || captured !== NO_PIECE) {
    return total;
  }

  // quiet moves only now
  if (killerMoves[ply][0] === move) {
    return 80_000;
  } else if (killerMoves[ply][1] === move) {
    return 70_000;
  }

  const piece = movePiece(move);
  const square = moveTo(move);
  return historyTable[piece][square];
}

// good captures -> promos -> bad captures
const GOOD_CAPTURE_BONUS = 100_000;
const PROMO_BONUS = 90_000;
const BAD_CAPTURE_BONUS = 80_000;
const KILLER_BONUS_MAIN = 70_000;
const KILLER_BONUS_SECOND = 60_000;

export function scoreMoveWithSEE(
  move: Move,
  pos: Position,
  ply: number,
  killerMoves: Uint32Array[],
  historyTable: Uint32Array[],
  pieceWeights: Int32Array,
  hashMove: Move = 0,
): number {
  const captured = moveCaptured(move);

  // Always do TT move first
  if (move === hashMove) {
    return 10_000_000;
  }

  let total = 0;

  // Captures next, ordered by MVV-LVA
  // (Most Valuable Victim - Least Valuable Attacker)
  if (captured !== NO_PIECE) {
    const piece = movePiece(move);
    const capturedVal = pieceWeights[captured];
    const attackerVal = pieceWeights[piece];

    let seeValue = 0;

    // if we capture a piece with equal or more value, see must be >= 0 so we can skip it
    if (capturedVal >= attackerVal) {
      seeValue = 1;
    } else {
      // Risking a more valuable piece to capture a less valueable one - must ensure its safe
      seeValue = see(move, pos, pieceWeights);
    }

    const mvvlva = MVV_LVA[captured * PIECE_N + piece];

    if (seeValue >= 0) {
      total += mvvlva + GOOD_CAPTURE_BONUS;
    } else {
      total += mvvlva + BAD_CAPTURE_BONUS;
    }
  }

  // Promotions
  const promo = movePromotion(move);
  if (promo !== NO_PIECE) {
    total += ORDERING_VALUES[promo] + PROMO_BONUS;
  }

  if (promo !== NO_PIECE || captured !== NO_PIECE) {
    return total;
  }

  // quiet moves only now
  if (killerMoves[ply][0] === move) {
    return KILLER_BONUS_MAIN;
  } else if (killerMoves[ply][1] === move) {
    return KILLER_BONUS_SECOND;
  }

  const piece = movePiece(move);
  const square = moveTo(move);
  return historyTable[piece][square];
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
