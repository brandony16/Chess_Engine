import { isSliding } from "../../coreLogic/helpers/bbUtils.mjs";
import {
  BLACK_KNIGHT,
  NO_PIECE,
  SLIDING_PIECES,
  WHITE_KNIGHT,
  type Piece,
} from "../chessConstants.ts";
import type Move from "../moveMaking/move.ts";
import type { Position } from "../Position.ts";
import { computeMaskForPiece } from "./attackMasks.ts";

/**
 * Updates the individualAttackMasks array with new values based off of the
 * move made.
 */
export const updateAttackMasks = (position: Position, move: Move): void => {
  const piece = move.piece;
  const captured = move.captured;
  const promotion = move.promotion;

  // Update non sliding pieces affected by the move
  if (!isSliding(piece)) {
    position.attackMasks[piece] = computeMaskForPiece(position, piece);
  }

  if (captured !== NO_PIECE && !isSliding(captured)) {
    position.attackMasks[captured] = computeMaskForPiece(position, captured);
  }

  // The only non sliding move that a promotion can be is a knight
  if (promotion === WHITE_KNIGHT || promotion === BLACK_KNIGHT) {
    position.attackMasks[promotion] = computeMaskForPiece(position, promotion);
  }

  const relevantBitMask = getRelevantMaskForMove(move);
  for (const slider of SLIDING_PIECES) {
    updateOneSlidingType(position, slider, move, relevantBitMask);
  }
};

/**
 * Update a single sliding‐piece type by only adjusting the sliders whose attack rays
 * are affected by the move
 */
function updateOneSlidingType(
  position: Position,
  piece: Piece,
  move: Move,
  relevantBitMask: bigint,
) {
  // If the piece is involved in the move, we will need to recompute it.
  if (
    move.captured === piece ||
    move.piece === piece ||
    move.promotion === piece
  ) {
    position.attackMasks[piece] = computeMaskForPiece(position, piece);
    return;
  }

  // If the pieces attacks are affected by the move, recompute the attacks
  let pieceAttackMask = position.attackMasks[piece];

  if ((pieceAttackMask & relevantBitMask) === 0n) return;

  position.attackMasks[piece] = computeMaskForPiece(position, piece);
}

/**
 * Gets the relevant bit mask for a move. The relevant bits are bits that
 * the move directly changes. These are the square the piece moves from,
 * the square it moves to, and the square where a pawn got captured if
 * en passant occured.
 */
function getRelevantMaskForMove(move: Move): bigint {
  let mask = 0n;

  mask |= 1n << BigInt(move.from);
  mask |= 1n << BigInt(move.to);

  if (move.enPassant) {
    // Get the square where the captured pawn was
    const dir = move.piece < 6 ? -8 : +8;
    const epCapturedPawnSquare = move.to + dir;
    mask |= 1n << BigInt(epCapturedPawnSquare);
  }
  return mask;
}
