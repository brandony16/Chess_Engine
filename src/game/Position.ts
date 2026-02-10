import { bitScanForward } from "../coreLogic/helpers/bbUtils.mjs";
import { computeMaskForPiece } from "./positionStates/attackMasks/attackMasks.ts";
import {
  ALL_CASTLING,
  BLACK,
  BLACK_BISHOP,
  BLACK_QUEEN,
  BLACK_ROOK,
  INITIAL_BITBOARDS,
  NO_PIECE,
  NO_SQUARE,
  NUM_PIECES,
  PIECES,
  PIECES_BY_PLAYER,
  WHITE,
  WHITE_BISHOP,
  WHITE_QUEEN,
  WHITE_ROOK,
  type PieceAt,
} from "./chessConstants.ts";
import type Move from "./moveMaking/move.ts";
import type { Bitboard, Player, Square } from "./types.ts";
import {
  CASTLING_ZOBRIST,
  EN_PASSANT_ZOBRIST,
  SIDE_TO_MOVE_ZOBRIST,
  zobristTable,
} from "./positionStates/zobrist.ts";

export class Position {
  bitboards: BigUint64Array;
  occupiedWhite: Bitboard;
  occupiedBlack: Bitboard;
  occupied: Bitboard;

  pieceAt: Int8Array; // length 64
  pieceIndexes: number[][];
  attackMasks: BigUint64Array;

  sideToMove: Player;
  castlingRights: number;
  enPassantSquare: number;
  halfmoveClock: number;
  fullmoveNumber: number;

  kingSq: Int8Array; // Indexed by player
  zobristKey: bigint;

  moveStack: Move[];

  constructor() {
    // ----- Board State -----
    this.bitboards = new BigUint64Array(NUM_PIECES);
    this.occupiedWhite = 0n;
    this.occupiedBlack = 0n;
    this.occupied = 0n;

    this.pieceAt = new Int8Array(64);
    this.pieceIndexes = new Array(64).fill(new Int8Array());
    this.attackMasks = new BigUint64Array(NUM_PIECES);

    // ----- Game State -----
    this.sideToMove = WHITE;
    this.castlingRights = ALL_CASTLING;
    this.enPassantSquare = NO_SQUARE;
    this.halfmoveClock = 0;
    this.fullmoveNumber = 1;

    // ----- Cached Info -----
    this.kingSq = new Int8Array(2);
    this.zobristKey = 0n;

    this.moveStack = [];

    this.loadInitialPosition();
  }

  loadInitialPosition(): void {
    this.bitboards.set(INITIAL_BITBOARDS);

    this.pieceAt.fill(NO_PIECE);
    this.attackMasks.fill(0n);

    this.kingSq[WHITE] = 4;
    this.kingSq[BLACK] = 60;

    this.recomputeOccupancy();
    this.computeZobrist();
    this.initializePieceAt();
    this.initializePieceIndexes();
  }

  initializePieceAt(): void {
    this.pieceAt.fill(NO_PIECE);

    for (let p = 0; p < NUM_PIECES; p++) {
      let bb = this.bitboards[p];
      while (bb) {
        const sq = bitScanForward(bb);
        this.pieceAt[sq] = p;
        bb &= bb - 1n;
      }
    }
  }

  initializePieceIndexes(): void {
    for (let p = 0; p < NUM_PIECES; p++) {
      this.pieceIndexes[p].length = 0;
    }

    for (let p = 0; p < NUM_PIECES; p++) {
      let bb = this.bitboards[p];
      const list = this.pieceIndexes[p];
      while (bb) {
        const sq = bitScanForward(bb);
        list.push(sq);
        bb &= bb - 1n;
      }
    }
  }

  calculateAttackMasks(): void {
    for (const p of PIECES) {
      this.attackMasks[p] = computeMaskForPiece(this, p);
    }
  }

  recomputeOccupancy(): void {
    this.occupiedWhite = 0n;
    this.occupiedBlack = 0n;

    for (let p = 0; p < 6; p++) {
      this.occupiedWhite |= this.bitboards[p];
      this.occupiedBlack |= this.bitboards[p + 6];
    }

    this.occupied = this.occupiedWhite | this.occupiedBlack;
  }

  computeZobrist(): bigint {
    let key = 0n;

    // Pieces
    for (let piece = 0; piece < NUM_PIECES; piece++) {
      let bb = this.bitboards[piece];
      while (bb) {
        const sq = bitScanForward(bb);
        key ^= zobristTable[piece * 64 + sq];
        bb &= bb - 1n;
      }
    }

    // Side to move
    if (this.sideToMove === BLACK) {
      key ^= SIDE_TO_MOVE_ZOBRIST;
    }

    // Castling rights
    key ^= CASTLING_ZOBRIST[this.castlingRights];

    // En passant (file-based)
    if (this.enPassantSquare !== NO_SQUARE) {
      key ^= EN_PASSANT_ZOBRIST[this.enPassantSquare & 7];
    }

    this.zobristKey = key;
    return key;
  }

  /**
   * Updates the previous hash. Is more efficient than computeHash as it only changes what it
   * needs to for the new hash. Compute hash redoes every calculation every time, which is
   * inefficient, especially when only a few things have changed since the last position.
   */
  updateZobrist(
    prevHash: bigint,
    move: Move,
    prevEpSq: Square,
    prevCastling: number,
  ): bigint {
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
    newHash ^= SIDE_TO_MOVE_ZOBRIST;

    if (prevEpSq !== this.enPassantSquare) {
      if (prevEpSq !== NO_SQUARE) {
        const prevEpFile = prevEpSq & 7;
        newHash ^= EN_PASSANT_ZOBRIST[prevEpFile];
      }

      if (this.enPassantSquare !== NO_SQUARE) {
        const newEpFile = this.enPassantSquare & 7;
        newHash ^= EN_PASSANT_ZOBRIST[newEpFile];
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

    newHash ^= CASTLING_ZOBRIST[prevCastling];
    newHash ^= CASTLING_ZOBRIST[this.castlingRights];

    return newHash;
  }

  // -----------------------
  // Core rule methods
  // -----------------------

  generateMoves(): Move[] {
    // fills moveList (preallocated array)
    return [];
  }

  makeMove(move: Move): void {
    // push undo info
    // mutate bitboards
    // update castling, EP, zobrist
    // toggle sideToMove
  }

  unmakeMove(): void {
    // restore from stack
  }

  isInCheck(player: Player = this.sideToMove): boolean {
    const opponent = player === WHITE ? BLACK : WHITE;
    const kingSquare = this.kingSq[player];

    return this.isSquareAttacked(kingSquare, opponent);
  }

  isLegalMove(move: Move): boolean {
    // optional helper
    return false;
  }

  hasLegalMove(player: Player = this.sideToMove): boolean {
    
    return false;
  }

  // -----------------------
  // Game Info Methods
  // -----------------------

  isPlayersPieceAt(square: number, player: Player): boolean {
    const p = this.pieceAt[square];
    if (p === NO_PIECE) return false;
    return player === WHITE ? p < 6 : p >= 6;
  }

  orthogonalAttackers(player: Player): bigint {
    return player === WHITE
      ? this.bitboards[WHITE_ROOK] | this.bitboards[WHITE_QUEEN]
      : this.bitboards[BLACK_ROOK] | this.bitboards[BLACK_QUEEN];
  }

  diagonalAttackers(player: Player): bigint {
    return player === WHITE
      ? this.bitboards[WHITE_BISHOP] | this.bitboards[WHITE_QUEEN]
      : this.bitboards[BLACK_BISHOP] | this.bitboards[BLACK_QUEEN];
  }

  playerPieceIndexes(player: Player): number[][] {
    const base = player === WHITE ? 0 : 6;
    return this.pieceIndexes.slice(base, base + 6);
  }

  getAttackMask(player: Player): bigint {
    let mask = 0n;
    for (const piece of PIECES_BY_PLAYER[player]) {
      mask |= this.attackMasks[piece];
    }

    return mask;
  }

  isSquareAttacked(square: Square, player: Player): boolean {
    const mask = this.getAttackMask(player);
    return (mask & (1n << BigInt(square))) !== 0n;
  }
}
