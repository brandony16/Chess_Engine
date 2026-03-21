import type { Position } from "../Position.ts";
import {
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  PLAYER_PIECES,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
  type Piece,
  type Player,
  type Square,
} from "../chessConstants.ts";
import { bishopAttacks, rookAttacks } from "../moveGen/sliderMoves.ts";
import { lsb, type Bitboard } from "../bb.ts";
import { bPMasksHi, bPMasksLo, wPMasksHi, wPMasksLo } from "./pawnMasks.ts";
import { knightMasksHi, knightMasksLo } from "./knightMasks.ts";
import { kingMasksHi, kingMasksLo } from "./kingMasks.ts";

/**
 * Generates the attack bitboard of a piece at a square
 */
export function attacksOf(
  piece: Piece,
  square: Square,
  occLo: number,
  occHi: number,
): Bitboard {
  switch (piece) {
    case WHITE_PAWN:
      return [wPMasksLo[square], wPMasksHi[square]];
    case BLACK_PAWN:
      return [bPMasksLo[square], bPMasksHi[square]];
    case WHITE_KNIGHT:
    case BLACK_KNIGHT:
      return [knightMasksLo[square], knightMasksHi[square]];
    case WHITE_KING:
    case BLACK_KING:
      return [kingMasksLo[square], kingMasksHi[square]];
    case WHITE_BISHOP:
    case BLACK_BISHOP:
      return bishopAttacks(square, occLo, occHi);
    case WHITE_ROOK:
    case BLACK_ROOK:
      return rookAttacks(square, occLo, occHi);
    case WHITE_QUEEN:
    case BLACK_QUEEN: {
      const [diagLo, diagHi] = bishopAttacks(square, occLo, occHi);
      const [orthoLo, orthoHi] = rookAttacks(square, occLo, occHi);
      return [diagLo | orthoLo, diagHi | orthoHi];
    }
    default:
      return [0, 0];
  }
}

/**
 * Gets all of the pieces that attack a given square.
 */
export function attacksTo(
  bbsLo: Int32Array,
  bbsHi: Int32Array,
  occLo: number,
  occHi: number,
  toSq: Square,
): Bitboard {
  let attackersLo = 0,
    attackersHi = 0;

  // ----- Mask Pieces -----
  // Pawns
  // Use mask of other color bc we want pawns that attack the toSq
  attackersLo |= bbsLo[WHITE_PAWN] & bPMasksLo[toSq];
  attackersHi |= bbsHi[WHITE_PAWN] & bPMasksHi[toSq];

  attackersLo |= bbsLo[BLACK_PAWN] & wPMasksLo[toSq];
  attackersHi |= bbsHi[BLACK_PAWN] & wPMasksHi[toSq];

  // Knights
  const knightsLo = bbsLo[WHITE_KNIGHT] | bbsLo[BLACK_KNIGHT];
  const knightsHi = bbsHi[WHITE_KNIGHT] | bbsHi[BLACK_KNIGHT];
  attackersLo |= knightMasksLo[toSq] & knightsLo;
  attackersHi |= knightMasksHi[toSq] & knightsHi;

  // Kings
  const kingsLo = bbsLo[WHITE_KING] | bbsLo[BLACK_KING];
  const kingsHi = bbsHi[WHITE_KING] | bbsHi[BLACK_KING];
  attackersLo |= kingMasksLo[toSq] & kingsLo;
  attackersHi |= kingMasksHi[toSq] & kingsHi;

  // ----- Sliding Pieces -----
  const queensLo = bbsLo[WHITE_QUEEN] | bbsLo[BLACK_QUEEN];
  const queensHi = bbsHi[WHITE_QUEEN] | bbsHi[BLACK_QUEEN];
  const rooksLo = bbsLo[WHITE_ROOK] | bbsLo[BLACK_ROOK];
  const rooksHi = bbsHi[WHITE_ROOK] | bbsHi[BLACK_ROOK];
  const bishopsLo = bbsLo[WHITE_BISHOP] | bbsLo[BLACK_BISHOP];
  const bishopsHi = bbsHi[WHITE_BISHOP] | bbsHi[BLACK_BISHOP];

  // Ortho
  const [orthoLo, orthoHi] = rookAttacks(toSq, occLo, occHi);
  const orthoPiecesLo = orthoLo & occLo;
  const orthoPiecesHi = orthoHi & occHi;

  attackersLo |= orthoPiecesLo & (rooksLo | queensLo);
  attackersHi |= orthoPiecesHi & (rooksHi | queensHi);

  // Diagonal
  const [diagLo, diagHi] = bishopAttacks(toSq, occLo, occHi);
  const diagPiecesLo = diagLo & occLo;
  const diagPiecesHi = diagHi & occHi;

  attackersLo |= diagPiecesLo & (bishopsLo | queensLo);
  attackersHi |= diagPiecesHi & (bishopsHi | queensHi);

  return [attackersLo, attackersHi];
}

/**
 * Computes the attack mask for a piece
 */
export function computeMaskForPiece(
  position: Position,
  piece: Piece,
): Bitboard {
  let maskLo = 0,
    maskHi = 0;

  let bbLo = position.bbsLo[piece];
  let bbHi = position.bbsHi[piece];
  while (bbLo || bbHi) {
    const square = lsb(bbLo, bbHi);

    const [attacksLo, attacksHi] = attacksOf(
      piece,
      square,
      position.occupiedLo,
      position.occupiedHi,
    );
    maskLo |= attacksLo;
    maskHi |= attacksHi;

    if (bbLo) bbLo &= bbLo - 1;
    else bbHi &= bbHi - 1;
  }

  return [maskLo, maskHi];
}

export function playerAttackMask(pos: Position, player: Player): Bitboard {
  let maskLo = 0,
    maskHi = 0;
  for (const piece of PLAYER_PIECES[player]) {
    const [lo, hi] = computeMaskForPiece(pos, piece);
    maskLo |= lo;
    maskHi |= hi;
  }

  return [maskLo, maskHi];
}
