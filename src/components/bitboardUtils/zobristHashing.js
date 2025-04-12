import { getPieceAtSquare } from "./pieceGetters";

/**
 * Zobrist table for hashing. Creates a unique bitstring for every piece at every square.
 * 64 Squares and 12 bitboards each, KQRBNP for each side.
 */
export const zobristTable = new Array(12)
  .fill(null)
  .map(() =>
    new Array(64)
      .fill(null)
      .map(() => BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)))
  );

/**
 * Computes a hash given the bitboards, the player whose turn it is, and an enPassantSquare.
 * Positions are NOT the same if the pieces are the same but it is a different players turn.
 * Positions are also NOT the same if en passant was legal before, but is no longer legal.
 *
 * @param {Bitboards} bitboards - the bitboards of the current position
 * @param {string} player - the player whose move it is ("w" or "b")
 * @param {number} enPassant - the en passant square. None assumes it is not legal.
 * @returns {bigint} hash for the position
 */
export const computeHash = (bitboards, player, enPassant = null) => {
  let hash = 0n;

  for (const [piece, bitboard] of Object.entries(bitboards)) {
    const pieceToZobrist = pieceToZobristIndex[piece];
    for (let square = 0; square < 64; square++) {
      if ((bitboard >> BigInt(square)) & 1n) {
        hash ^= zobristTable[pieceToZobrist][square]; // XOR with zobrist value
      }
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

  return hash;
};

/**
 * Updates the previous hash. Is more efficient than computeHash as it only changes what it needs to for the new hash.
 * Compute hash redoes every calculation every time, which is inefficient, especially when only a few things have
 * changed since the last position.
 *
 * @param {Bitboards} prevBitboards - bitboards before the move
 * @param {Bitboards} bitboards - bitboards after the move
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
  prevHash
) => {
  let newHash = prevHash;
  let pieceFrom = getPieceAtSquare(from, prevBitboards);

  // XOR the piece at the previous position
  const zobristFromIndex = pieceToZobristIndex[pieceFrom];
  const zobristFrom = zobristTable[zobristFromIndex][from];
  newHash ^= zobristFrom;

  // XOR the pieces new location
  const pieceTo = getPieceAtSquare(to, bitboards);
  const zobristToIndex = pieceToZobristIndex[pieceTo];
  const zobristTo = zobristTable[zobristToIndex][to];
  newHash ^= zobristTo;

  // if a capture, XOR to remove captured piece
  const prevPieceTo = getPieceAtSquare(to, prevBitboards);
  if (prevPieceTo) {
    const zobristCapturedIndex = pieceToZobristIndex[prevPieceTo];
    const zobristCaptured = zobristTable[zobristCapturedIndex][to];
    newHash ^= zobristCaptured;
  }

  // XOR player
  newHash ^= PLAYER_ZOBRIST;

  if (enPassantChanged) {
    newHash ^= EN_PASSANT_ZOBRIST;
  }

  return newHash;
};

// Random big ints to generate distinct hashes for when it is one players turn and when en passant is legal.
export const PLAYER_ZOBRIST = 0x9d39247e33776d41n;
export const EN_PASSANT_ZOBRIST = 0xf3a9b72c85d614e7n;

/**
 * Converts a piece type to the corresponding index for that piece in the zobrist table
 */
export const pieceToZobristIndex = {
  whitePawns: 0,
  whiteKnights: 1,
  whiteBishops: 2,
  whiteRooks: 3,
  whiteQueens: 4,
  whiteKings: 5,
  blackPawns: 6,
  blackKnights: 7,
  blackBishops: 8,
  blackRooks: 9,
  blackQueens: 10,
  blackKings: 11,
};