import { WHITE_PAWN } from "../chessConstants.ts";
import type { Position } from "../Position.ts";
import { makeCastleMove, unMakeCastleMove } from "./castleMoveLogic.ts";
import Move from "./move.ts";

/**
 * Makes a move. Directly alters the given bitboards.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the position
 * @param {Move} move - a move object
 */
export const applyMove = (position: Position, move: Move) => {
  const bitboards = position.bitboards;
  const pieceAt = position.pieceAt;

  const one = 1n;
  const maskFrom = one << BigInt(move.from);
  const maskTo = one << BigInt(move.to);

  const piece = move.piece;
  const captured = move.captured;
  const promotion = move.promotion;
  const enPassant = move.enPassant;

  // Handle castle case
  if (move.castling) {
    makeCastleMove(position, move);
    return;
  }

  // Remove moving piece
  bitboards[piece] &= ~maskFrom;

  // Remove captured piece
  if (move.captured !== null && !enPassant) {
    bitboards[captured] &= ~maskTo;
  }

  pieceAt[move.from] = null;

  // Handles promotions
  if (promotion) {
    bitboards[promotion] |= maskTo; // Add promoted piece
    pieceAt[move.to] = promotion;
  } else {
    bitboards[piece] |= maskTo;
    pieceAt[move.to] = piece;
  }

  if (enPassant) {
    const dir = piece === WHITE_PAWN ? -8 : 8;
    // Remove the captured pawn from the opposing pawn bitboard
    bitboards[captured] &= ~(one << BigInt(move.to + dir));

    pieceAt[move.to + dir] = null;
  }

  updateIndexArrays(move);
  updateAttackMasks(bitboards, move);

  position.sideToMove ^= 1;
};

/**
 * Undoes a move that was made. Directly alters given bitboards.
 *
 * @param {Move} move - the move to be undone
 * @param {BigUint64Array} bitboards - the bitboards of the position
 */
export const unapplyMove = (position: Position, move: Move) => {
  const bitboards = position.bitboards;
  const pieceAt = position.pieceAt;

  const from = move.from;
  const to = move.to;

  const one = 1n;
  const maskFrom = one << BigInt(from);
  const maskTo = one << BigInt(to);

  const piece = move.piece;
  const captured = move.captured;
  const promotion = move.promotion;
  const enPassant = move.enPassant;

  // Undo castle
  if (move.castling) {
    unMakeCastleMove(position, move);
    return;
  }

  pieceAt[to] = null;
  pieceAt[from] = piece;

  // Undo promotion
  if (promotion) {
    bitboards[promotion] &= ~maskTo;
    bitboards[piece] |= maskFrom;
  } else {
    bitboards[piece] &= ~maskTo;
    bitboards[piece] |= maskFrom;
  }

  // Restore captured piece
  if (captured !== null && !enPassant) {
    bitboards[captured] |= maskTo;
    pieceAt[to] = captured;
  }

  // Undo en passant capture
  if (enPassant) {
    const dir = piece === WHITE_PAWN ? -8 : 8;
    const capturedPawnSquare = to + dir;
    bitboards[captured] |= one << BigInt(capturedPawnSquare);
    pieceAt[capturedPawnSquare] = captured;
  }

  undoIndexArrayUpdate(move);
  updateAttackMasks(bitboards, move);
};

// const moveFrom = (from, to, piece, enPassantSquare) => {
//   const isWhite = piece <= 5;
//   const castling = isKing(piece) && Math.abs(from - to) === 2;
//   const enPassant =
//     to === enPassantSquare && isPawn(piece);
//   let captured = pieceAt[to];
//   if (enPassant) {
//     captured = isWhite ? BLACK_PAWN : WHITE_PAWN;
//   }

//   const move = new Move(from, to, piece, captured, null, castling, enPassant);
//   return move;
// };

// /**
//  * Converts a move bitboard into an array of moves.
//  *
//  * @param {bigint} bitboard - the move bitboard
//  * @param {number} from - the square moving from
//  * @param {number} piece - the index of the piece
//  * @param {number} enPassantSquare - the square where en passant is legal
//  * @param {0 | 1} player - whose move it is (0 for w, 1 for b)
//  * @returns {Array<Move>} - an array of move objects
//  */
// export const getMovesFromBB = (
//   bitboard,
//   from,
//   piece,
//   enPassantSquare,
//   player
// ) => {
//   const moveArr = [];

//   const promotionFromRank = player === WHITE ? 6 : 1;
//   const row = Math.floor(from / 8);
//   const isPromotion = row === promotionFromRank && isPawn(piece);

//   let moves = bitboard;
//   while (moves !== 0n) {
//     const to = bitScanForward(moves);
//     moves &= moves - 1n;

//     const move = moveFrom(from, to, piece, enPassantSquare);

//     // If a promotion is possible, can promote to knight, bishop, rook, or queen
//     if (isPromotion) {
//       const promoPieces =
//         player === WHITE ? WHITE_PROMO_PIECES : BLACK_PROMO_PIECES;
//       for (const promoPiece of promoPieces) {
//         const promoMove = move.copyWith({ promotion: promoPiece });
//         moveArr.push(promoMove);
//       }
//     } else {
//       moveArr.push(move);
//     }
//   }

//   return moveArr;
// };
