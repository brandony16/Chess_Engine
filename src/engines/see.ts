import { attacksTo } from "../game/attackMasks/attackMasks.ts";
import { lsb } from "../game/bb.ts";
import {
  BLACK_BISHOP,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  NO_PIECE,
  WHITE,
  WHITE_BISHOP,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
  type Piece,
  type Player,
  type Square,
} from "../game/chessConstants.ts";
import { bishopAttacks, rookAttacks } from "../game/moveGen/sliderMoves.ts";
import {
  moveCaptured,
  moveFrom,
  movePiece,
  moveTo,
  type Move,
} from "../game/moveMaking/move.ts";
import type { Position } from "../game/Position.ts";

// create gain array outside of function to avoid allocating a new array
// every time the function is called and then GC destorys the NPS
const gain = new Int32Array(32);

export function see(move: Move, pos: Position, pieceWeights: Int32Array) {
  const fromSq = moveFrom(move);
  const toSq = moveTo(move);
  const target = moveCaptured(move);
  let piece = movePiece(move);

  // if a quiet move or promo without captures, see is 0
  if (target === NO_PIECE) return 0;

  let d = 0;

  let occLo = pos.occupiedLo;
  let occHi = pos.occupiedHi;

  let fromSetLo = 0;
  let fromSetHi = 0;
  if (fromSq < 32) fromSetLo = 1 << fromSq;
  else fromSetHi = 1 << (fromSq - 32);

  const bbsLo = pos.bbsLo;
  const bbsHi = pos.bbsHi;
  const mayXrayLo =
    bbsLo[WHITE_PAWN] |
    bbsLo[BLACK_PAWN] |
    bbsLo[WHITE_BISHOP] |
    bbsLo[BLACK_BISHOP] |
    bbsLo[WHITE_ROOK] |
    bbsLo[BLACK_ROOK] |
    bbsLo[WHITE_QUEEN] |
    bbsLo[BLACK_QUEEN];

  const mayXrayHi =
    bbsHi[WHITE_PAWN] |
    bbsHi[BLACK_PAWN] |
    bbsHi[WHITE_BISHOP] |
    bbsHi[BLACK_BISHOP] |
    bbsHi[WHITE_ROOK] |
    bbsHi[BLACK_ROOK] |
    bbsHi[WHITE_QUEEN] |
    bbsHi[BLACK_QUEEN];

  let [attadefLo, attadefHi] = attacksTo(bbsLo, bbsHi, occLo, occHi, toSq);

  gain[0] = pieceWeights[target];

  let side = pos.sideToMove;
  do {
    d++;
    side ^= 1;

    // Speculative score: your piece's value minus what the opponent gained previously
    gain[d] = pieceWeights[piece] - gain[d - 1];

    // if even the best case speculative score is bad, we can stop early
    if (Math.max(-gain[d - 1], gain[d]) < 0) break;

    // Remove the current attacker from the tracking arrays
    attadefLo ^= fromSetLo;
    attadefHi ^= fromSetHi;
    occLo ^= fromSetLo;
    occHi ^= fromSetHi;

    if ((fromSetLo & mayXrayLo) !== 0 || (fromSetHi & mayXrayHi) !== 0) {
      const [xrayLo, xrayHi] = considerXrays(pos, occLo, occHi, toSq);
      attadefLo |= xrayLo;
      attadefHi |= xrayHi;
    }

    // Grab the next smallest piece from the remaining attackers for the active side
    [fromSetLo, fromSetHi, piece] = getLeastValuablePiece(
      pos,
      attadefLo,
      attadefHi,
      side as Player,
    );
  } while (fromSetLo !== 0 || fromSetHi !== 0);

  // negamax retraction to get final score
  while (--d > 0) {
    gain[d - 1] = -Math.max(-gain[d - 1], gain[d]);
  }

  return gain[0];
}

function considerXrays(
  pos: Position,
  occLo: number,
  occHi: number,
  toSq: Square,
): [number, number] {
  let xrayLo = 0,
    xrayHi = 0;

  const diagAttacks = bishopAttacks(toSq, occLo, occHi);
  const orthoAttacks = rookAttacks(toSq, occLo, occHi);

  const bbsLo = pos.bbsLo;
  const bbsHi = pos.bbsHi;

  xrayLo =
    (diagAttacks[0] &
      occLo &
      (bbsLo[WHITE_BISHOP] |
        bbsLo[BLACK_BISHOP] |
        bbsLo[WHITE_QUEEN] |
        bbsLo[BLACK_QUEEN])) |
    (orthoAttacks[0] &
      occLo &
      (bbsLo[WHITE_ROOK] |
        bbsLo[BLACK_ROOK] |
        bbsLo[WHITE_QUEEN] |
        bbsLo[BLACK_QUEEN]));

  xrayHi =
    (diagAttacks[1] &
      occHi &
      (bbsHi[WHITE_BISHOP] |
        bbsHi[BLACK_BISHOP] |
        bbsHi[WHITE_QUEEN] |
        bbsHi[BLACK_QUEEN])) |
    (orthoAttacks[1] &
      occHi &
      (bbsHi[WHITE_ROOK] |
        bbsHi[BLACK_ROOK] |
        bbsHi[WHITE_QUEEN] |
        bbsHi[BLACK_QUEEN]));

  return [xrayLo, xrayHi];
}

function getLeastValuablePiece(
  pos: Position,
  attadefLo: number,
  attadefHi: number,
  side: Player,
): [number, number, Piece] {
  const offset = side === WHITE ? 0 : 6;

  for (let pt = 1; pt <= 6; pt++) {
    const pIdx = pt + offset;
    const subsetLo = attadefLo & pos.bbsLo[pIdx];
    const subsetHi = attadefHi & pos.bbsHi[pIdx];

    if (subsetLo !== 0 || subsetHi !== 0) {
      const sq = lsb(subsetLo, subsetHi);
      let fromSetLo = 0,
        fromSetHi = 0;
      if (sq < 32) fromSetLo = 1 << sq;
      else fromSetHi = 1 << (sq - 32);

      return [fromSetLo, fromSetHi, pIdx as Piece];
    }
  }

  return [0, 0, NO_PIECE]; // No more legal attackers available
}
