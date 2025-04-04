import {
  filterIllegalMoves,
  isKingsideCastleLegal,
  isQueensideCastleLegal,
} from "./bbChessLogic";
import {
  bigIntFullRep,
  bitScanForward,
  FILE_A_MASK,
  FILE_H_MASK,
  generalSymbols,
  getAllPieces,
  getBlackPieces,
  getEmptySquares,
  getPieceAtSquare,
  getWhitePieces,
  pieceSymbols,
  RANK_1_MASK,
  RANK_8_MASK,
  slide,
} from "./bbHelpers";
import { kingMasks } from "./PieceMasks/kingMask";
import { knightMasks } from "./PieceMasks/knightMask";
import { blackPawnMasks, whitePawnMasks } from "./PieceMasks/pawnMask";

// Gets the legal moves of a piece
export const getPieceMoves = (
  bitboards,
  piece,
  from,
  player,
  enPassantSquare,
  castlingRights,
  onlyCaptures = false
) => {
  let moves = null;
  switch (piece.toUpperCase()) {
    case "P":
      moves = getPawnMovesForSquare(
        bitboards,
        player,
        from,
        enPassantSquare,
        onlyCaptures
      );
      break;
    case "N":
      moves = getKnightMovesForSquare(bitboards, player, from);
      break;
    case "B":
      moves = getBishopMovesForSquare(bitboards, player, from);
      break;
    case "R":
      moves = getRookMovesForSquare(bitboards, player, from);
      break;
    case "Q":
      moves = getQueenMovesForSquare(bitboards, player, from);
      break;
    case "K":
      moves = getKingMovesForSquare(bitboards, player, from, castlingRights);
      break;
    default:
      moves = BigInt(0); // No legal moves
  }

  return moves;
};

// Gets all moves for a player. Does NOT check for legality (if the move puts the king in check)
export const getAllPlayerMoves = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  onlyCaptures = false
) => {
  let allMoves = 0n;
  // Get player's overall pieces bitboard.
  const playerPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  let pieces = playerPieces;
  while (pieces !== 0n) {
    const square = bitScanForward(pieces);
    pieces &= pieces - 1n;

    const piece = getPieceAtSquare(square, bitboards);
    const formattedPiece = pieceSymbols[piece].toUpperCase();

    const pieceMoves = getPieceMoves(
      bitboards,
      formattedPiece,
      square,
      player,
      enPassantSquare,
      castlingRights,
      onlyCaptures
    );

    allMoves |= pieceMoves;
  }

  return allMoves;
};

export const getAllLegalMoves = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare,
  onlyCaptures = false
) => {
  let allMoves = 0n;
  // Get player's overall pieces bitboard.
  const playerPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  let pieces = playerPieces;
  while (pieces !== 0n) {
    const square = bitScanForward(pieces);
    pieces &= pieces - 1n;

    const piece = getPieceAtSquare(square, bitboards);
    const formattedPiece = pieceSymbols[piece].toUpperCase();

    const pieceMoves = getPieceMoves(
      bitboards,
      formattedPiece,
      square,
      player,
      enPassantSquare,
      castlingRights,
      onlyCaptures
    );

    const legalPieceMoves = filterIllegalMoves(
      bitboards,
      pieceMoves,
      square,
      player
    );

    allMoves |= legalPieceMoves;
  }

  return allMoves;
};

export const getAllIndividualLegalMoves = (
  bitboards,
  player,
  castlingRights,
  enPassantSquare
) => {
  let allMoves = {};
  // Get player's overall pieces bitboard.
  const playerPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  let pieces = playerPieces;
  while (pieces !== 0n) {
    const square = bitScanForward(pieces);
    pieces &= pieces - 1n;

    const piece = getPieceAtSquare(square, bitboards);
    const formattedPiece = generalSymbols[piece];

    const pieceMoves = getPieceMoves(
      bitboards,
      formattedPiece,
      square,
      player,
      enPassantSquare,
      castlingRights
    );

    const legalPieceMoves = filterIllegalMoves(
      bitboards,
      pieceMoves,
      square,
      player
    );
    if (legalPieceMoves !== 0n) {
      allMoves[square] = legalPieceMoves;
    }
  }

  return allMoves;
};

/* SPECIFIC PIECE MOVE FUNCTIONS */
export const getPawnMovesForSquare = (
  bitboards,
  player,
  from,
  enPassantSquare,
  attacksOnly = false
) => {
  const specificPawn = 1n << BigInt(from);

  const isPlayerWhite = player === "w";
  const emptySquares = getEmptySquares(bitboards);
  const enemyPieces = isPlayerWhite
    ? getBlackPieces(bitboards)
    : getWhitePieces(bitboards);

  let singlePush = 0n;
  let doublePush = 0n;
  let capture = 0n;
  let enPassantCapture = 0n;

  if (isPlayerWhite) {
    if (!attacksOnly) {
      singlePush = (specificPawn << 8n) & emptySquares;
      doublePush =
        ((specificPawn & 0x000000000000ff00n) << 16n) &
        emptySquares &
        (emptySquares << 8n);
    }
    capture = whitePawnMasks[from] & enemyPieces;

    // En Passant for white
    if (enPassantSquare !== null) {
      const epMask = 1n << BigInt(enPassantSquare);
      if ((specificPawn << 7n) & epMask) {
        enPassantCapture |= 1n << BigInt(enPassantSquare);
      }
      if ((specificPawn << 9n) & epMask) {
        enPassantCapture |= 1n << BigInt(enPassantSquare);
      }
    }
  } else {
    if (!attacksOnly) {
      singlePush = (specificPawn >> 8n) & emptySquares;
      doublePush =
        ((specificPawn & 0x00ff000000000000n) >> 16n) &
        emptySquares &
        (emptySquares >> 8n);
    }
    capture = blackPawnMasks[from] & enemyPieces;

    // En Passant for black
    if (enPassantSquare !== null) {
      const epMask = 1n << BigInt(enPassantSquare);
      if ((specificPawn >> 9n) & epMask) {
        enPassantCapture |= 1n << BigInt(enPassantSquare);
      }
      if ((specificPawn >> 7n) & epMask) {
        enPassantCapture |= 1n << BigInt(enPassantSquare);
      }
    }
  }

  return singlePush | doublePush | capture | enPassantCapture;
};

export const getKnightMovesForSquare = (bitboards, player, from) => {
  // Get raw knight moves
  let moves = knightMasks[from];

  // Get player's pieces to mask out self-captures
  const friendlyPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  // Remove moves that land on friendly pieces
  return moves & ~friendlyPieces;
};

export const getBishopMovesForSquare = (bitboards, player, from) => {
  let bishopBitboard = 1n << BigInt(from);
  let moves = 0n;

  // Get occupied squares
  const allPieces = getAllPieces(bitboards);
  const friendlyPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  moves |= slide(bishopBitboard, 9n, FILE_H_MASK & RANK_8_MASK, allPieces); // Up-right
  moves |= slide(bishopBitboard, 7n, FILE_A_MASK & RANK_8_MASK, allPieces); // Up-left
  moves |= slide(bishopBitboard, -7n, FILE_H_MASK & RANK_1_MASK, allPieces); // Down-right
  moves |= slide(bishopBitboard, -9n, FILE_A_MASK & RANK_1_MASK, allPieces); // Down-left

  return moves & ~friendlyPieces;
};

export const getRookMovesForSquare = (bitboards, player, from) => {
  let rookBitboard = 1n << BigInt(from);
  let moves = 0n;

  const allPieces = getAllPieces(bitboards);
  const friendlyPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  moves |= slide(rookBitboard, 1n, FILE_H_MASK, allPieces);
  moves |= slide(rookBitboard, -1n, FILE_A_MASK, allPieces);
  moves |= slide(rookBitboard, 8n, RANK_8_MASK, allPieces);
  moves |= slide(rookBitboard, -8n, RANK_1_MASK, allPieces);

  return moves & ~friendlyPieces;
};

export const getQueenMovesForSquare = (bitboards, player, from) => {
  let queenBitboard = 1n << BigInt(from);
  let moves = 0n;

  const allPieces = getAllPieces(bitboards);
  const friendlyPieces =
    player === "w" ? getWhitePieces(bitboards) : getBlackPieces(bitboards);

  // Orthogonal Moves
  moves |= slide(queenBitboard, 1n, FILE_H_MASK, allPieces); // Right
  moves |= slide(queenBitboard, -1n, FILE_A_MASK, allPieces); // Left
  moves |= slide(queenBitboard, 8n, RANK_8_MASK, allPieces); // Up
  moves |= slide(queenBitboard, -8n, RANK_1_MASK, allPieces); // Down

  // Diagonal Moves
  moves |= slide(queenBitboard, 9n, FILE_H_MASK & RANK_8_MASK, allPieces); // Up-right
  moves |= slide(queenBitboard, 7n, FILE_A_MASK & RANK_8_MASK, allPieces); // Up-left
  moves |= slide(queenBitboard, -7n, FILE_H_MASK & RANK_1_MASK, allPieces); // Down-right
  moves |= slide(queenBitboard, -9n, FILE_A_MASK & RANK_1_MASK, allPieces); // Down-left

  return moves & ~friendlyPieces;
};

export const getKingMovesForSquare = (
  bitboards,
  player,
  from,
  castlingRights = null
) => {
  let moves = kingMasks[from];
  const isPlayerWhite = player === "w";

  const friendlyPieces = isPlayerWhite
    ? getWhitePieces(bitboards)
    : getBlackPieces(bitboards);

  /* CASTLING */
  if (castlingRights) {
    if (isPlayerWhite) {
      if (
        castlingRights.whiteKingside &&
        isKingsideCastleLegal(bitboards, "w")
      ) {
        moves |= 1n << 6n;
      }
      if (
        castlingRights.whiteQueenside &&
        isQueensideCastleLegal(bitboards, "w")
      ) {
        moves |= 1n << 2n;
      }
    } else {
      if (
        castlingRights.blackKingside &&
        isKingsideCastleLegal(bitboards, "b")
      ) {
        moves |= 1n << 62n;
      }
      if (
        castlingRights.blackQueenside &&
        isQueensideCastleLegal(bitboards, "b")
      ) {
        moves |= 1n << 58n;
      }
    }
  }

  // Remove squares occupied by own pieces
  return moves & ~friendlyPieces;
};
