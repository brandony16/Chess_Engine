import {
  bigIntFullRep,
  bitScanForward,
  generalSymbols,
  getBlackPieces,
  getNumPieces,
  getPieceAtSquare,
  getWhitePieces,
  isPlayersPieceAtSquare,
  pieceSymbols,
} from "./bbHelpers";
import {
  getAllLegalMoves,
  getAllPlayerMoves,
  getPieceMoves,
} from "./bbMoveGeneration";
import { getCachedAttackMask } from "./PieceMasks/attackMask";

/**
 * @typedef {object} Bitboards
 * @property {bigint} whitePawns - bitboard of the white pawns
 * @property {bigint} whiteKnights - bitboard of the white knights
 * @property {bigint} whiteBishops - bitboard of the white bishops
 * @property {bigint} whiteRooks - bitboard of the white rooks
 * @property {bigint} whiteQueens - bitboard of the white queens
 * @property {bigint} whiteKings - bitboard of the white king
 * @property {bigint} blackPawns - bitboard of the black pawns
 * @property {bigint} blackKnights - bitboard of the black knights
 * @property {bigint} blackBishops - bitboard of the black bishops
 * @property {bigint} blackRooks - bitboard of the black rooks
 * @property {bigint} blackQueens - bitboard of the black queens
 * @property {bigint} blackKings - bitboard of the black king
 */

/**
 * @typedef {object} CastlingRights
 * @property {boolean} whiteKingside - Whether castling kingside is legal for white
 * @property {boolean} whiteQueenside - Whether castling queenside is legal for white
 * @property {boolean} blackKingside - Whether castling kingside is legal for black
 * @property {boolean} blackQueenside - Whether castling queenside is legal for black
 */

/**
 * @typedef {Object} MoveResult
 * @property {object} bitboards - The updated bitboards after the move
 * @property {number} enPassantSquare - The square where enPassant is legal
 * @property {boolean} isCapture - Whether the move was a capture
 */

/**
 * Makes a move. Does not validate that moves are legal, as that is handled by other functions.
 *
 * @param {Bitboards} bitboards - bitboards of the current position
 * @param {number} from - square to move from
 * @param {number} to - square to move to
 * @param {number} enPassantSquare - square where en passant is legal, if any
 * @param {string} promotionPiece - piece the move promotes to, if any
 * @returns {MoveResult}
 */
export const makeMove = (
  bitboards,
  from,
  to,
  enPassantSquare = null,
  promotionPiece = null
) => {
  let updatedBitboards = { ...bitboards };
  const bigIntFrom = BigInt(from);
  const bigIntTo = BigInt(to);
  const one = 1n;
  const maskFrom = one << bigIntFrom;
  const maskTo = one << bigIntTo;

  // Handle castle case
  const pieceAtFrom = getPieceAtSquare(from, bitboards);
  if (generalSymbols[pieceAtFrom] === "K" && Math.abs(to - from) === 2) {
    return makeCastleMove(bitboards, from, to);
  }

  // Find which piece is at 'from' square
  let movingPiece = null;
  const pieceKeys = Object.keys(bitboards);
  for (const piece of pieceKeys) {
    const bitboard = bitboards[piece];
    if ((bitboard & maskFrom) !== 0n) {
      movingPiece = piece;
      updatedBitboards[piece] &= ~(one << bigIntFrom);
      break;
    }
  }

  if (!movingPiece) return { bitboards: updatedBitboards };

  // Check if a piece exists at 'to' (capture)
  let isCapture = false;
  for (const piece of pieceKeys) {
    const bitboard = updatedBitboards[piece];
    if ((bitboard & maskTo) !== 0n) {
      updatedBitboards[piece] &= ~maskTo; // Remove captured piece
      isCapture = true;
      break;
    }
  }

  // Handles promotions
  if (promotionPiece) {
    const promotedPieceKey =
      movingPiece.charAt(0) === "w"
        ? `white${promotionPiece}`
        : `black${promotionPiece}`;

    updatedBitboards[promotedPieceKey] |= one << bigIntTo; // Add promoted piece
    return {
      bitboards: updatedBitboards,
      enPassantSquare: null,
      isCapture: isCapture,
    };
  }

  // Move piece to 'to' square
  updatedBitboards[movingPiece] |= maskTo;

  // Handle En Passant
  const piecePrefix = movingPiece.charAt(0);
  const pieceTypeIndicator = movingPiece.charAt(5);
  let newEnPassantSquare = null;
  if (pieceTypeIndicator === "P") {
    const isPlayerWhite = piecePrefix === "w";
    const dir = isPlayerWhite ? -8 : 8;
    if (Math.abs(to - from) === 16) {
      newEnPassantSquare = to + dir;
    }
    if (to === enPassantSquare) {
      // Remove the captured pawn from the opposing pawn bitboard
      updatedBitboards[isPlayerWhite ? "blackPawns" : "whitePawns"] &= ~(
        one << BigInt(to + dir)
      );
    }
  }

  return {
    bitboards: updatedBitboards,
    enPassantSquare: newEnPassantSquare,
    isCapture: isCapture,
  };
};

/**
 * Determines whether a given move is legal.
 *
 * @param {Bitboards} bitboards - bitboards of the current position
 * @param {number} from - the square to move from
 * @param {number} to - the square to move to
 * @param {string} player - the player whose move it is ("w" or "b")
 * @param {number} enPassantSquare
 *                the square where enPassant can happen, if any
 * @param {CastlingRights} castlingRights - the castling rights
 * @returns {boolean} - if the move is legal
 */
export const isValidMove = (
  bitboards,
  from,
  to,
  player,
  enPassantSquare = null,
  castlingRights
) => {
  // If the final square is one of the player's pieces, then it is not valid
  // Cannot capture your own piece
  if (isPlayersPieceAtSquare(player, to, bitboards)) {
    return false;
  }

  // Get the piece type then convert it to 'P', 'N', 'B', 'R', 'Q', or 'K'
  const piece = getPieceAtSquare(from, bitboards);
  if (piece === null) return false;

  const formattedPiece = generalSymbols[piece];

  const pieceMoves = getPieceMoves(
    bitboards,
    formattedPiece,
    from,
    player,
    enPassantSquare,
    castlingRights
  );
  const legalMoves = filterIllegalMoves(bitboards, pieceMoves, from, player);

  return Boolean((legalMoves >> BigInt(to)) & BigInt(1));
};

/**
 * Determines whether a given square is attacked by the opponent
 *
 * @param {Bitboards} bitboards - bitboards of the current position
 * @param {number} square - square to check if it is attacked
 * @param {string} opponent - the other player ("w" or "b")
 * @returns {boolean} if the square is attacked
 */
export const isSquareAttacked = (bitboards, square, opponent) => {
  const opponentAttackMask = getCachedAttackMask(bitboards, opponent);
  return (opponentAttackMask & (1n << BigInt(square))) !== 0n;
};

/**
 * Determines whether a given player is in check.
 *
 * @param {Bitboards} bitboards - bitboards of the current position
 * @param {string} player - player whose turn it is ("w" or "b")
 * @returns {boolean} whether the player is in check
 */
export const isInCheck = (bitboards, player) => {
  let kingBB = bitboards.whiteKings;
  let opponent = "b";
  if (player === "b") {
    kingBB = bitboards.blackKings;
    opponent = "w";
  }

  const kingSquare = bitScanForward(kingBB);

  return isSquareAttacked(bitboards, kingSquare, opponent);
};

/**
 * Filters out illegal moves from a bitboard of moves for a piece.
 * Mainly filters out moves that put your own king in check.
 *
 * @param {Bitboards} bitboards - bitboards of the current position
 * @param {bigint} moves - bitboard of moves for a piece
 * @param {number} from - square the piece is moving from
 * @param {string} player - player whose turn it is ("w" or "b")
 * @returns {bigint} the filtered moves
 */
export const filterIllegalMoves = (bitboards, moves, from, player) => {
  let filteredMoves = 0n;
  const isPlayerWhite = player === "w";
  const one = 1n;

  // Iterate only over moves that are set (i.e. bits that are 1)
  let remainingMoves = moves;
  while (remainingMoves !== 0n) {
    const to = bitScanForward(remainingMoves);
    remainingMoves &= remainingMoves - one;

    // Simulate the move and check if the king is attacked
    const tempBitboards = makeMove(bitboards, from, to, null).bitboards;
    const kingBB = tempBitboards[isPlayerWhite ? "whiteKings" : "blackKings"];
    const kingSquare = bitScanForward(kingBB);
    if (
      !isSquareAttacked(tempBitboards, kingSquare, isPlayerWhite ? "b" : "w")
    ) {
      filteredMoves |= 1n << BigInt(to);
    }
  }

  return filteredMoves;
};

/**
 * Updates castling rights given the square moved from. If any rook or king moves, castling is updated.
 * Because they always start at squares 0, 4, 7, 56, 60, and 63; any move from these squares means the rights need to be updated.
 *
 * @param {number} from - the square the piece is moving from
 * @param {CastlingRights} prevRights - the rights to update. Has fields whiteKingside, whiteQueenside, blackKingside, blackQueenside
 * @returns {CastlingRights} the new castling rights
 */
export const updateCastlingRights = (from, prevRights) => {
  const newRights = { ...prevRights };

  // If a king moves, it loses castling rights
  if (from === 4) {
    newRights.whiteKingside = false;
    newRights.whiteQueenside = false;
  } else if (from === 60) {
    newRights.blackKingside = false;
    newRights.blackQueenside = false;
  }

  // If rooks move, disable their respective castling
  else if (from === 0) newRights.whiteQueenside = false;
  else if (from === 7) newRights.whiteKingside = false;
  else if (from === 56) newRights.blackQueenside = false;
  else if (from === 63) newRights.blackKingside = false;

  return newRights;
};

/* CASTLING FUNCTIONS */
/**
 * Determines whether a given player can castle kingside
 *
 * @param {Bitboards} bitboards - the current positions bitboards
 * @param {string} player - the player who is castling ("w" or "b")
 * @returns {boolean} whether the player can castle kingside
 */
export const isKingsideCastleLegal = (bitboards, player) => {
  let squares;
  let opponent;
  let playerKing;
  if (player === "w") {
    squares = [4, 5, 6];
    opponent = "b";
    playerKing = "K";
  } else {
    squares = [60, 61, 62];
    opponent = "w";
    playerKing = "k";
  }

  // Check if squares are empty or under attack
  for (let square of squares) {
    const piece = getPieceAtSquare(square, bitboards);
    if (piece !== null && pieceSymbols[piece] !== playerKing) {
      return false;
    }
    if (isSquareAttacked(bitboards, square, opponent)) {
      return false;
    }
  }

  return true;
};

/**
 * Determines whether a given player can castle queenside
 *
 * @param {Bitboards} bitboards - the current positions bitboards
 * @param {string} player - the player who is castling ("w" or "b")
 * @returns {boolean} whether the player can castle queenside
 */
export const isQueensideCastleLegal = (bitboards, player) => {
  let squares;
  let opponent;
  let playerKing;
  if (player === "w") {
    squares = [1, 2, 3, 4];
    opponent = "b";
    playerKing = "K";
  } else {
    squares = [57, 58, 59, 60];
    opponent = "w";
    playerKing = "k";
  }

  // Check if squares are empty or under attack
  for (let square of squares) {
    const piece = getPieceAtSquare(square, bitboards);
    if (piece !== null && pieceSymbols[piece] !== playerKing) {
      return false;
    }
    if (isSquareAttacked(bitboards, square, opponent)) {
      return false;
    }
  }

  return true;
};

/**
 * Executes a castling move and returns updated game state.
 *
 * @param {Bitboards} bitboards - The current position's bitboards.
 * @param {number} from - The square the king is moving from.
 * @param {number} to - The square the king is moving to.
 * @returns {MoveResult} An object containing the updated bitboards, null for enPassantSquare,and false for isCapture.
 */
const makeCastleMove = (bitboards, from, to) => {
  let newBitboards = { ...bitboards };

  if (from === 4 && to === 6) {
    // White kingside castling
    newBitboards.whiteKings &= ~(1n << 4n);
    newBitboards.whiteKings |= 1n << 6n;
    newBitboards.whiteRooks &= ~(1n << 7n);
    newBitboards.whiteRooks |= 1n << 5n;
  } else if (from === 4 && to === 2) {
    // White queenside castling
    newBitboards.whiteKings &= ~(1n << 4n);
    newBitboards.whiteKings |= 1n << 2n;
    newBitboards.whiteRooks &= ~(1n << 0n);
    newBitboards.whiteRooks |= 1n << 3n;
  } else if (from === 60 && to === 62) {
    // Black kingside castling
    newBitboards.blackKings &= ~(1n << 60n);
    newBitboards.blackKings |= 1n << 62n;
    newBitboards.blackRooks &= ~(1n << 63n);
    newBitboards.blackRooks |= 1n << 61n;
  } else if (from === 60 && to === 58) {
    // Black queenside castling
    newBitboards.blackKings &= ~(1n << 60n);
    newBitboards.blackKings |= 1n << 58n;
    newBitboards.blackRooks &= ~(1n << 56n);
    newBitboards.blackRooks |= 1n << 59n;
  }
  return { bitboards: newBitboards, enPassantSquare: null, isCapture: false };
};

/**
 * Determines if the game is over. Checks for checkmate, stalemate, threefold repetition, draw by insufficient material, and draw by 50 move rule.
 * @param {Bitboards} bitboards - the current positions bitboards
 * @param {string} player - player who would win if it was mate ("w" or "b")
 * @param {Map} pastPositions - the map of past positions stored as hashes.
 * @param {CastlingRights} castlingRights - the castling rights
 * @param {number} enPassantSquare - the square where enPassant can occur
 * @returns {{ isGameOver: boolean, result: string}} An object with fields for isGameOver and result
 */
export const checkGameOver = (
  bitboards,
  player,
  pastPositions,
  castlingRights,
  enPassantSquare
) => {
  const isPlayerWhite = player === "w";
  const opponent = isPlayerWhite ? "b" : "w";

  const allLegalMoves = getAllLegalMoves(
    bitboards,
    opponent,
    castlingRights,
    enPassantSquare
  );

  const kingBB = bitboards[isPlayerWhite ? "blackKings" : "whiteKings"];
  const kingSquare = bitScanForward(kingBB);

  const result = { isGameOver: false, result: null };

  if (drawByInsufficientMaterial(bitboards)) {
    result.isGameOver = true;
    result.result = "Draw by Insufficient Material";
    return result;
  }
  if (drawByFiftyMoveRule(bitboards, pastPositions)) {
    result.isGameOver = true;
    result.result = "Draw By 50 Move Rule";
    return result;
  }
  if (drawByRepetition(pastPositions)) {
    result.isGameOver = true;
    result.result = "Draw by Repetition";
    return result;
  }

  // If player has no moves it is stalemate or checkmate
  if (allLegalMoves === 0n) {
    result.isGameOver = true;

    if (isSquareAttacked(bitboards, kingSquare, player)) {
      const fullPlayer = isPlayerWhite ? "White" : "Black";

      result.result = `${fullPlayer} Wins by Checkmate`;
      return result;
    }

    result.result = "Draw by Stalemate";
    return result;
  }

  return result;
};

/**
 * Determines if the game is a draw because neither side has sufficient checkmating material. Only insufficient if both sides only have 1 or 0 minor pieces (knight and bishop).
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @returns {boolean} if it is a draw by insufficient material
 */
export const drawByInsufficientMaterial = (bitboards) => {
  const whitePieces = getWhitePieces(bitboards);
  const blackPieces = getBlackPieces(bitboards);

  const queens = bitboards.whiteQueens | bitboards.blackQueens;
  const rooks = bitboards.whiteRooks | bitboards.blackRooks;
  const pawns = bitboards.whitePawns | bitboards.blackPawns;
  const queensRooksPawns = queens | rooks | pawns;

  if (queensRooksPawns !== 0n) {
    return false;
  } else if (getNumPieces(whitePieces) <= 2 && getNumPieces(blackPieces) <= 2) {
    return true;
  }

  return false;
};

/**
 * Determines if the same position has been repeated three times. If so the game is a draw. Note: The positon is NOT the same if the pieces
 * are the same and whose move it is is different. It is also not the same if en Passant was legal, and is no longer legal
 * @param {Map} pastPositions - The map of the past positions. Stored as hashes
 * @returns {boolean} if it is a threefold repetition
 */
export const drawByRepetition = (pastPositions) => {
  for (let count of pastPositions.values()) {
    if (count >= 3) {
      return true;
    }
  }
  return false;
};

/**
 * STILL IN PROGRESS. NEED TO ACTUALLY IMPLEMENT.
 *
 * Determines if the game should end by the 50 move rule. The fifty rule move is if there is no capture or pawn move for 50 moves then the
 * game is a draw. A move is each player moving once, so 100 ply.
 * @param {Array} pastPositions - an array of the past positions
 * @returns {boolean} if is a draw by the 50 move rule
 */
export const drawByFiftyMoveRule = (pastPositions) => {
  return false;
};

/**
 * Sorts a given array of moves so that captures are at the front of the array.
 * @param {Array} moves - an array of all the moves. Each move should be an object with an isCapture field.
 * @returns {Array} the sorted moves.
 */
export const sortMoves = (moves) => {
  return moves.sort((a, b) => b.isCapture - a.isCapture);
};
