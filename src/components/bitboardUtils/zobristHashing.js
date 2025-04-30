import { bitScanForward } from "./bbUtils";
import {
  CASTLING_ZOBRIST,
  EN_PASSANT_ZOBRIST,
  NUM_PIECES,
  PLAYER_ZOBRIST,
} from "./constants";
import { getPieceAtSquare } from "./pieceGetters";

function rand64() {
  // Create two 32-bit random integers
  const high = Math.floor(Math.random() * 0x100000000); // Upper 32 bits
  const low = Math.floor(Math.random() * 0x100000000); // Lower 32 bits

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
 * Computes a hash given the bitboards, the player whose turn it is, and an enPassantSquare.
 * Positions are NOT the same if the pieces are the same but it is a different players turn.
 * Positions are also NOT the same if en passant was legal before, but is no longer legal.
 *
 * @param {BigUint64Array} bitboards - the bitboards of the current position
 * @param {string} player - the player whose move it is ("w" or "b")
 * @param {number} enPassant - the en passant square. None assumes it is not legal.
 * @returns {bigint} hash for the position
 */
export const computeHash = (
  bitboards,
  player,
  enPassant = null,
  castlingRights = null
) => {
  let hash = 0n;

  // XOR each piece
  for (let piece = 0; piece < NUM_PIECES; piece++) {
    let bitboard = bitboards[piece];
    while (bitboard) {
      const lsBit = bitboard & -bitboard;
      const sq = bitScanForward(lsBit);
      hash ^= zobristTable[piece * 64 + sq];
      bitboard &= bitboard - 1n;
    }
  }

  // XOR a value for the side to move
  if (player === "w") {
    hash ^= PLAYER_ZOBRIST;
  }

  // Value for if enPassant is legal
  if (enPassant) {
    hash ^= EN_PASSANT_ZOBRIST;
  }

  if (castlingRights) {
    if (castlingRights.whiteKingside) hash ^= CASTLING_ZOBRIST.K;
    if (castlingRights.whiteQueenside) hash ^= CASTLING_ZOBRIST.Q;
    if (castlingRights.blackKingside) hash ^= CASTLING_ZOBRIST.k;
    if (castlingRights.blackQueenside) hash ^= CASTLING_ZOBRIST.q;
  }

  return hash;
};

/**
 * Updates the previous hash. Is more efficient than computeHash as it only changes what it needs to for the new hash.
 * Compute hash redoes every calculation every time, which is inefficient, especially when only a few things have
 * changed since the last position.
 *
 * @param {BigUint64Array} prevBitboards - bitboards before the move
 * @param {BigUint64Array} bitboards - bitboards after the move
 * @param {number} to - where the piece moved to
 * @param {number} from - where the piece moved from
 * @param {boolean} enPassantChanged - whether en passant has changed from legal to not legal or vice versa compared to the previous position.
 * @param {bigint} prevHash - the hash from the previous position
 * @returns {bigint} the new hash
 */
export const updateHash = (
  prevBitboards,
  bitboards,
  to,
  from,
  enPassantChanged,
  castlingChanged,
  prevHash
) => {
  let newHash = prevHash;
  let pieceFrom = getPieceAtSquare(from, prevBitboards);

  // XOR the piece at the previous position
  const zobristFrom = zobristTable[pieceFrom * 64 + from];
  newHash ^= zobristFrom;

  // XOR the pieces new location
  const pieceTo = getPieceAtSquare(to, bitboards);
  const zobristTo = zobristTable[pieceTo * 64 + to];
  newHash ^= zobristTo;

  // if a capture, XOR to remove captured piece
  const prevPieceTo = getPieceAtSquare(to, prevBitboards);
  if (prevPieceTo) {
    const zobristCaptured = zobristTable[prevPieceTo * 64 + to];
    newHash ^= zobristCaptured;
  }

  // XOR player
  newHash ^= PLAYER_ZOBRIST;

  if (enPassantChanged) {
    newHash ^= EN_PASSANT_ZOBRIST;
  }

  if (castlingChanged.whiteKingside) newHash ^= CASTLING_ZOBRIST.K;
  if (castlingChanged.whiteQueenside) newHash ^= CASTLING_ZOBRIST.Q;
  if (castlingChanged.blackKingside) newHash ^= CASTLING_ZOBRIST.k;
  if (castlingChanged.blackQueenside) newHash ^= CASTLING_ZOBRIST.q;

  return newHash;
};
