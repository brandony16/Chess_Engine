import { bitScanForward } from "../coreLogic/helpers/bbUtils.mjs";
import { BLACK, EN_PASSANT_ZOBRIST, INITIAL_BITBOARDS, NUM_PIECES, WHITE } from "./chessConstants.js";
import { CASTLING_ZOBRIST, SIDE_TO_MOVE_ZOBRIST, zobristTable } from "./zobrist.js";

export class Position {
  constructor() {
    // ----- Board State -----
    this.bitboards = new BigUint64Array(NUM_PIECES);
    this.occupiedWhite = 0n;
    this.occupiedBlack = 0n;
    this.occupied = 0n;

    // ----- Game State -----
    this.sideToMove = WHITE;
    this.castlingRights = 0b1111;
    this.enPassantSquare = -1;
    this.halfmoveClock = 0;
    this.fullmoveNumber = 1;

    // ----- Cached Info -----
    this.kingSq = new Int8Array(2);
    this.zobristKey = 0n;

    this.moveStack = [];

    this.loadInitialPosition();
  }

  loadInitialPosition() {
    this.bitboards.set(INITIAL_BITBOARDS);

    this.kingSq[WHITE] = 4;
    this.kingSq[BLACK] = 60;

    this.recomputeOccupancy();
    this.computeZobrist();
  }

  recomputeOccupancy() {
    this.occupiedWhite = 0n;
    this.occupiedBlack = 0n;

    for (let p = 0; p < 6; p++) {
      this.occupiedWhite |= this.bitboards[p];
      this.occupiedBlack |= this.bitboards[p + 6];
    }

    this.occupied = this.occupiedWhite | this.occupiedBlack;
  }

  computeZobrist() {
    let key = 0n;

    // Pieces
    for (let piece = 0; piece < 12; piece++) {
      let bb = this.bitboards[piece];
      while (bb) {
        const sq = bitScanForward(bb);
        key ^= zobristTable[piece][sq];
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
    if (this.enPassantSquare !== -1) {
      key ^= EN_PASSANT_ZOBRIST[this.enPassantSquare & 7];
    }

    this.zobristKey = key;
  }

    // -----------------------
  // Core rule methods
  // -----------------------

  generateMoves() {
    // fills moveList (preallocated array)
  }

  makeMove(move) {
    // push undo info
    // mutate bitboards
    // update castling, EP, zobrist
    // toggle sideToMove
  }

  unmakeMove() {
    // restore from stack
  }

  isInCheck(player = this.sideToMove) {
    // use cached kingSq
  }

  isLegalMove(move) {
    // optional helper
  }
}