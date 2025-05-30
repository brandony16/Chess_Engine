import { bitScanForward } from "./bbUtils";
import {
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  INITIAL_BITBOARDS,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "./constants";

const whitePawnIndicies = new Array();
const whiteKnightIndicies = new Array();
const whiteBishopIndicies = new Array();
const whiteRookIndicies = new Array();
const whiteQueenIndicies = new Array();
const whiteKingIndicies = new Array();

const blackPawnIndicies = new Array();
const blackKnightIndicies = new Array();
const blackBishopIndicies = new Array();
const blackRookIndicies = new Array();
const blackQueenIndicies = new Array();
const blackKingIndicies = new Array();

export const indexArrays = [
  whitePawnIndicies,
  whiteKnightIndicies,
  whiteBishopIndicies,
  whiteRookIndicies,
  whiteQueenIndicies,
  whiteKingIndicies,
  blackPawnIndicies,
  blackKnightIndicies,
  blackBishopIndicies,
  blackRookIndicies,
  blackQueenIndicies,
  blackKingIndicies,
];

initializePieceIndicies(INITIAL_BITBOARDS);

export function updateIndexArrays(move) {
  const piece = move.piece;
  const from = move.from;
  const to = move.to;
  const captured = move.captured;
  const promotion = move.promotion;
  const enPassant = move.enPassant;
  const castling = move.castling;

  const pieceArr = indexArrays[piece];
  if (promotion) {
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
  const piece = move.piece;
  const from = move.from;
  const to = move.to;
  const captured = move.captured;
  const promotion = move.promotion;
  const enPassant = move.enPassant;
  const castling = move.castling;

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

export function initializePieceIndicies(bitboards) {
  initKingIndicies(bitboards);
  initQueenIndicies(bitboards);
  initRookIndicies(bitboards);
  initBishopIndicies(bitboards);
  initKnightIndicies(bitboards);
  initPawnIndicies(bitboards);
}

function initKingIndicies(bitboards) {
  clearArray(whiteKingIndicies);
  clearArray(blackKingIndicies);

  let whiteKingBB = bitboards[WHITE_KING];
  while (whiteKingBB) {
    const sq = bitScanForward(whiteKingBB);
    whiteKingIndicies.push(sq);

    whiteKingBB &= whiteKingBB - 1n;
  }

  let blackKingBB = bitboards[BLACK_KING];
  while (blackKingBB) {
    const sq = bitScanForward(blackKingBB);
    blackKingIndicies.push(sq);

    blackKingBB &= blackKingBB - 1n;
  }
}

function initQueenIndicies(bitboards) {
  clearArray(whiteQueenIndicies);
  clearArray(blackQueenIndicies);

  let whiteRookBB = bitboards[WHITE_QUEEN];
  while (whiteRookBB) {
    const sq = bitScanForward(whiteRookBB);
    whiteQueenIndicies.push(sq);

    whiteRookBB &= whiteRookBB - 1n;
  }

  let blackRookBB = bitboards[BLACK_QUEEN];
  while (blackRookBB) {
    const sq = bitScanForward(blackRookBB);
    blackQueenIndicies.push(sq);

    blackRookBB &= blackRookBB - 1n;
  }
}

function initRookIndicies(bitboards) {
  clearArray(whiteRookIndicies);
  clearArray(blackRookIndicies);

  let whiteRookBB = bitboards[WHITE_ROOK];
  while (whiteRookBB) {
    const sq = bitScanForward(whiteRookBB);
    whiteRookIndicies.push(sq);

    whiteRookBB &= whiteRookBB - 1n;
  }

  let blackRookBB = bitboards[BLACK_ROOK];
  while (blackRookBB) {
    const sq = bitScanForward(blackRookBB);
    blackRookIndicies.push(sq);

    blackRookBB &= blackRookBB - 1n;
  }
}

function initBishopIndicies(bitboards) {
  clearArray(whiteBishopIndicies);
  clearArray(blackBishopIndicies);

  let whiteBishopBB = bitboards[WHITE_BISHOP];
  while (whiteBishopBB) {
    const sq = bitScanForward(whiteBishopBB);
    whiteBishopIndicies.push(sq);

    whiteBishopBB &= whiteBishopBB - 1n;
  }

  let blackBishopBB = bitboards[BLACK_BISHOP];
  while (blackBishopBB) {
    const sq = bitScanForward(blackBishopBB);
    blackBishopIndicies.push(sq);

    blackBishopBB &= blackBishopBB - 1n;
  }
}

function initKnightIndicies(bitboards) {
  clearArray(whiteKnightIndicies);
  clearArray(blackKnightIndicies);

  let whitePawnBB = bitboards[WHITE_KNIGHT];
  while (whitePawnBB) {
    const sq = bitScanForward(whitePawnBB);
    whiteKnightIndicies.push(sq);

    whitePawnBB &= whitePawnBB - 1n;
  }

  let blackPawnBB = bitboards[BLACK_KNIGHT];
  while (blackPawnBB) {
    const sq = bitScanForward(blackPawnBB);
    blackKnightIndicies.push(sq);

    blackPawnBB &= blackPawnBB - 1n;
  }
}

function initPawnIndicies(bitboards) {
  clearArray(whitePawnIndicies);
  clearArray(blackPawnIndicies);

  let whitePawnBB = bitboards[WHITE_PAWN];
  while (whitePawnBB) {
    const sq = bitScanForward(whitePawnBB);
    whitePawnIndicies.push(sq);

    whitePawnBB &= whitePawnBB - 1n;
  }

  let blackPawnBB = bitboards[BLACK_PAWN];
  while (blackPawnBB) {
    const sq = bitScanForward(blackPawnBB);
    blackPawnIndicies.push(sq);

    blackPawnBB &= blackPawnBB - 1n;
  }
}

function clearArray(arr) {
  while (arr.length > 0) {
    arr.pop();
  }
}
