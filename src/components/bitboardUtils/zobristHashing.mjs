import {
  BLACK,
  BLACK_ROOK,
  CASTLING_ZOBRIST,
  NUM_PIECES,
  WHITE_ROOK,
} from "./constants.mjs";
import { getAllIndicies } from "./pieceIndicies.mjs";
import { pieceAt } from "./pieceGetters.mjs";

/**
 * Generates a random 64 bit integer
 * @returns {bigint} - a random bigint
 */
function rand64() {
  // Create two 32-bit random integers
  const high = Math.floor(Math.random() * 0x100000000);
  const low = Math.floor(Math.random() * 0x100000000);

  // Combine them into a 64-bit BigInt
  return (BigInt(high) << 32n) | BigInt(low);
}

/**
 * Zobrist table for hashing. Creates a unique bitstring for every piece at every square.
 * 12 bitboards and 64 squares, KQRBNP for each side. Index of a piece at a square is the
 * piece number multiplied by 64 plus the sqaure number. A white pawn moving to a4 would be
 * 0 (white pawn) * 64 + 24 (a4)
 */
export const zobristTable = new BigUint64Array(NUM_PIECES * 64);

// populate:
for (let p = 0; p < NUM_PIECES; p++) {
  for (let sq = 0; sq < 64; sq++) {
    zobristTable[p * 64 + sq] = rand64();
  }
}

/**
 * Create En Passant keys for hashing. One for each file
 */
export const epKeys = Array(8)
  .fill(null)
  .map(() => rand64());

/**
 * Create castling keys for hashing. One for each type of castling
 * (White Kingside, White Queenside, Black Kingside, Black Queenside)
 */
export const castleKeys = [rand64(), rand64(), rand64(), rand64()];

/**
 * A player key used for hashing
 */
export const playerKey = rand64();

/**
 * Computes a hash given the bitboards, the player whose turn it is, and an enPassantSquare.
 * Positions are NOT the same if the pieces are the same but it is a different players turn.
 * Positions are also NOT the same if en passant was legal before, but is no longer legal.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {number} sideToMove - whose move it is (0 for w, 1 for b)
 * @param {number} enPassantFile - The file where enPassant is legal (0-7, -1 if none)
 * @param {Array<Boolean>} castlingRights - the castling rights of the position.
 * @returns {bigint} hash for the position
 */
export const computeHash = (
  bitboards,
  sideToMove,
  enPassantFile = null,
  castlingRights = null
) => {
  let hash = 0n;

  // XOR each piece
  const pieceSquares = getAllIndicies();
  for (const square of pieceSquares) {
    const piece = pieceAt[square];
    hash ^= zobristTable[piece * 64 + square];
  }

  // XOR a value for the side to move
  if (sideToMove === BLACK) {
    hash ^= playerKey;
  }

  // En passant
  if (enPassantFile >= 0) {
    hash ^= epKeys[enPassantFile];
  }

  if (castlingRights) {
    for (let i = 0; i < castlingRights.length; i++) {
      if (castlingRights[i]) {
        hash ^= castleKeys[i];
      }
    }
  }

  return hash;
};

/**
 * Updates the previous hash. Is more efficient than computeHash as it only changes what it
 * needs to for the new hash. Compute hash redoes every calculation every time, which is
 * inefficient, especially when only a few things have changed since the last position.
 *
 * @param {bigint} prevHash - the hash from the previous position
 * @param {Move} move - the move object
 * @param {number} prevEpFile - the file where en passant was legal before the move (-1 for none)
 * @param {number} newEpFile - the file where en passant is legal after the move (-1 for none)
 * @param {Array<boolean>} castlingChanged - an array with a boolean for each castling direction and
 * if it changed with the move.
 * @returns {bigint} the new hash
 */
export const updateHash = (
  prevHash,
  move,
  prevEpFile,
  newEpFile,
  castlingChanged
) => {
  let newHash = prevHash;
  const from = move.from;
  const to = move.to;
  const captured = move.captured;

  // XOR the piece at the previous position
  const zobristFrom = zobristTable[move.piece * 64 + from];
  newHash ^= zobristFrom;

  // XOR the pieces new location
  const pieceTo = move.promotion ? move.promotion : move.piece;
  const zobristTo = zobristTable[pieceTo * 64 + to];
  newHash ^= zobristTo;

  // if a capture, XOR to remove captured piece
  if (captured !== null) {
    const zobristCaptured = zobristTable[captured * 64 + to];
    newHash ^= zobristCaptured;
  }

  // XOR player
  newHash ^= playerKey;

  if (prevEpFile !== newEpFile) {
    if (prevEpFile >= 0) {
      newHash ^= epKeys[prevEpFile];
    }
    if (newEpFile >= 0) {
      newHash ^= epKeys[newEpFile];
    }
  }

  if (move.castling) {
    // King must move from square 4 if white is castling
    const isWhite = from === 4;
    const rook = isWhite ? WHITE_ROOK : BLACK_ROOK;

    // Queenside
    if (from > to) {
      const queenRookFromSquare = isWhite ? 0 : 56;
      newHash ^= zobristTable[rook * 64 + queenRookFromSquare];

      const queenRookToSquare = queenRookFromSquare + 3;
      newHash ^= zobristTable[rook * 64 + queenRookToSquare];
    } else {
      // Kingside
      const kingRookFromSquare = isWhite ? 7 : 63;
      newHash ^= zobristTable[rook * 64 + kingRookFromSquare];

      const kingRookToSquare = kingRookFromSquare - 2;
      newHash ^= zobristTable[rook * 64 + kingRookToSquare];
    }
  }

  for (let i = 0; i < castlingChanged.length; i++) {
    if (castlingChanged[i]) {
      newHash ^= CASTLING_ZOBRIST[i];
    }
  }

  return newHash;
};
