import { bitScanForward } from "./bbUtils.mjs";
import {
  BLACK_ROOK,
  INITIAL_BITBOARDS,
  NUM_PIECES,
  WHITE,
  WHITE_ROOK,
} from "./constants.mjs";

export const indexArrays = Array.from({ length: NUM_PIECES }, () => []);

initializePieceIndicies(INITIAL_BITBOARDS);

export function updateIndexArrays(move) {
  const { piece, from, to, captured, promotion, enPassant, castling } = move;

  const pieceArr = indexArrays[piece];
  if (promotion !== null) {
    const promoPieceArr = indexArrays[promotion];
    // Add promotion piece and remove piece that promoted
    promoPieceArr.push(to);
    pieceArr.splice(pieceArr.indexOf(from), 1);
  } else {
    // Move piece
    pieceArr[pieceArr.indexOf(from)] = to;
  }

  // Remove captured piece
  if (captured !== null) {
    const capturedArr = indexArrays[captured];
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
      const rookArr = indexArrays[WHITE_ROOK];
      if (to === 6) {
        rookArr[rookArr.indexOf(7)] = 5;
      } else {
        rookArr[rookArr.indexOf(0)] = 3;
      }
    } else {
      // Black
      const rookArr = indexArrays[BLACK_ROOK];
      if (to === 62) {
        rookArr[rookArr.indexOf(63)] = 61;
      } else {
        rookArr[rookArr.indexOf(56)] = 59;
      }
    }
  }
}

export function undoIndexArrayUpdate(move) {
  const { piece, from, to, captured, promotion, enPassant, castling } = move;

  const pieceArr = indexArrays[piece];
  if (promotion) {
    const promoPieceArr = indexArrays[promotion];
    // Remove promotion piece and add piece that promoted
    promoPieceArr.splice(promoPieceArr.indexOf(to), 1);
    pieceArr.push(from);
  } else {
    // Move piece
    pieceArr[pieceArr.indexOf(to)] = from;
  }

  // Add captured piece
  if (captured !== null) {
    const capturedArr = indexArrays[captured];
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
      const rookArr = indexArrays[WHITE_ROOK];
      if (to === 6) {
        rookArr[rookArr.indexOf(5)] = 7;
      } else {
        rookArr[rookArr.indexOf(3)] = 0;
      }
    } else {
      // Black
      const rookArr = indexArrays[BLACK_ROOK];
      if (to === 62) {
        rookArr[rookArr.indexOf(61)] = 63;
      } else {
        rookArr[rookArr.indexOf(59)] = 56;
      }
    }
  }
}

export function getPlayerIndicies(player) {
  const base = player === WHITE ? 0 : 6;

  const result = [];
  for (let p = base; p < base + 6; p++) {
    result.push(...indexArrays[p]);
  }
  return result;
}

export function getAllIndicies() {
  let indicies = [];
  for (let i = 0; i < NUM_PIECES; i++) {
    indicies.push(...indexArrays[i]);
  }
  return indicies;
}

export function initializePieceIndicies(bitboards) {
  for (let p = 0; p < NUM_PIECES; p++) {
    indexArrays[p].length = 0;
  }

  for (let p = 0; p < NUM_PIECES; p++) {
    let bb = bitboards[p];
    const list = indexArrays[p];
    while (bb) {
      const sq = bitScanForward(bb);
      list.push(sq);
      bb &= bb - 1n;
    }
  }
}
