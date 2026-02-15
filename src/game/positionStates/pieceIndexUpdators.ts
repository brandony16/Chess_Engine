import {
  BLACK_ROOK,
  NO_PIECE,
  WHITE_ROOK,
  type Square,
} from "../chessConstants.ts";
import type Move from "../moveMaking/move.ts";

export function updatePieceIndexes(pieceIndexes: Square[][], move: Move): void {
  const { piece, from, to, captured, promotion, enPassant, castling } = move;

  const pieceArr = pieceIndexes[piece];
  if (promotion !== NO_PIECE) {
    const promoPieceArr = pieceIndexes[promotion];
    // Add promotion piece and remove piece that promoted
    promoPieceArr.push(to);
    pieceArr.splice(pieceArr.indexOf(from), 1);
  } else {
    // Move piece
    pieceArr[pieceArr.indexOf(from)] = to;
  }

  // Remove captured piece
  if (captured !== NO_PIECE) {
    const capturedArr = pieceIndexes[captured];
    if (enPassant) {
      const captureSquare = to > from ? to - 8 : to + 8;
      capturedArr.splice(capturedArr.indexOf(captureSquare), 1);
    } else {
      capturedArr.splice(capturedArr.indexOf(to), 1);
    }
  }

  if (castling) {
    // White
    if (from === 4) {
      const rookArr = pieceIndexes[WHITE_ROOK];
      if (to === 6) {
        rookArr[rookArr.indexOf(7)] = 5;
      } else {
        rookArr[rookArr.indexOf(0)] = 3;
      }
    } else {
      // Black
      const rookArr = pieceIndexes[BLACK_ROOK];
      if (to === 62) {
        rookArr[rookArr.indexOf(63)] = 61;
      } else {
        rookArr[rookArr.indexOf(56)] = 59;
      }
    }
  }
}

export function undoPieceIndexUpdate(
  pieceIndexes: Square[][],
  move: Move,
): void {
  const { piece, from, to, captured, promotion, enPassant, castling } = move;

  const pieceArr = pieceIndexes[piece];
  if (promotion) {
    const promoPieceArr = pieceIndexes[promotion];
    // Remove promotion piece and add piece that promoted
    promoPieceArr.splice(promoPieceArr.indexOf(to), 1);
    pieceArr.push(from);
  } else {
    // Move piece
    pieceArr[pieceArr.indexOf(to)] = from;
  }

  // Add captured piece
  if (captured !== null) {
    const capturedArr = pieceIndexes[captured];
    if (enPassant) {
      const captureSquare = to > from ? to - 8 : to + 8;
      capturedArr.push(captureSquare);
    } else {
      capturedArr.push(to);
    }
  }

  if (castling) {
    // White
    if (from === 4) {
      const rookArr = pieceIndexes[WHITE_ROOK];
      if (to === 6) {
        rookArr[rookArr.indexOf(5)] = 7;
      } else {
        rookArr[rookArr.indexOf(3)] = 0;
      }
    } else {
      // Black
      const rookArr = pieceIndexes[BLACK_ROOK];
      if (to === 62) {
        rookArr[rookArr.indexOf(61)] = 63;
      } else {
        rookArr[rookArr.indexOf(59)] = 56;
      }
    }
  }
}
