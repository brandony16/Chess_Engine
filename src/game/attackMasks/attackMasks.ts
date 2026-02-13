import { kingMasks } from "./kingMasks.ts";
import { knightMasks } from "./knightMasks.ts";
import { blackPawnMasks, whitePawnMasks } from "./pawnMasks.ts";
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
import {
  bishops,
  kings,
  knights,
  queens,
  rooks,
} from "../pieceUtils/pieceGetters.ts";

/**
 * Generates the attack bitboard of a piece at a square
 */
export function attacksOf(
  piece: Piece,
  square: Square,
  occupancy: bigint,
): bigint {
  switch (piece) {
    case WHITE_PAWN:
      return whitePawnMasks[square];
    case BLACK_PAWN:
      return blackPawnMasks[square];
    case WHITE_KNIGHT:
    case BLACK_KNIGHT:
      return knightMasks[square];
    case WHITE_KING:
    case BLACK_KING:
      return kingMasks[square];
    case WHITE_BISHOP:
    case BLACK_BISHOP: {
      return bishopAttacks(square, occupancy);
    }
    case WHITE_ROOK:
    case BLACK_ROOK: {
      return rookAttacks(square, occupancy);
    }
    case WHITE_QUEEN:
    case BLACK_QUEEN: {
      return bishopAttacks(square, occupancy) | rookAttacks(square, occupancy);
    }
    default:
      return 0n;
  }
}

/**
 * Gets all of the pieces that attack a given square.
 */
export function attacksTo(position: Position, toSq: Square): bigint {
  const bitboards = position.bitboards;
  const occ = position.occupied;
  let attackers = 0n;

  // Pawns
  attackers |= bitboards[WHITE_PAWN] & blackPawnMasks[toSq];
  attackers |= bitboards[BLACK_PAWN] & whitePawnMasks[toSq];

  // Knights
  const knightBB = knights(bitboards);
  attackers |= knightMasks[toSq] & knightBB;

  // Kings
  const kingBB = kings(bitboards);
  attackers |= kingMasks[toSq] & kingBB;

  // Sliding Pieces
  const queenBB = queens(bitboards);
  const orthoPieces = rookAttacks(toSq, occ) & occ;
  attackers |= orthoPieces & (rooks(bitboards) | queenBB);

  const diagPieces = bishopAttacks(toSq, occ) & occ;
  attackers |= diagPieces & (bishops(bitboards) | queenBB);

  return attackers;
}

/**
 * Computes the attack mask for a piece
 */
export function computeMaskForPiece(position: Position, piece: Piece): bigint {
  let mask = 0n;
  const indicies = position.pieceIndexes[piece];
  for (const square of indicies) {
    mask |= attacksOf(piece, square, position.occupied);
  }

  return mask;
}

export function playerAttackMask(pos: Position, player: Player) {
  let mask = 0n;
  for (const piece of PLAYER_PIECES[player]) {
    mask |= computeMaskForPiece(pos, piece);
  }

  return mask;
}
