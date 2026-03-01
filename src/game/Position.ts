import { bitScanForward, popcount } from "./helpers/bbUtils.ts";
import { attacksTo } from "./attackMasks/attackMasks.ts";
import {
  ALL_CASTLING,
  BLACK,
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_QUEEN,
  BLACK_ROOK,
  BLACK_WIN,
  CHECKMATE,
  DRAW,
  FIFTY_MOVE_RULE,
  IN_PROGRESS,
  INITIAL_BITBOARDS,
  INSUFFICIENT_MATERIAL,
  NO_PIECE,
  NO_SQUARE,
  NUM_PIECES,
  PIECES,
  REPETITION,
  STALEMATE,
  WHITE,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_QUEEN,
  WHITE_ROOK,
  WHITE_WIN,
  type Bitboard,
  type EndState,
  type Piece,
  type Player,
  type Result,
  type Square,
} from "./chessConstants.ts";
import type Move from "./moveMaking/move.ts";
import {
  CASTLING_ZOBRIST,
  EN_PASSANT_ZOBRIST,
  SIDE_TO_MOVE_ZOBRIST,
  zobristTable,
} from "./positionStates/zobrist.ts";
import {
  drawByInsufficientMaterial,
  drawByRepetition,
} from "./positionStates/gameOverLogic.ts";
import { getPieceMoves } from "./moveGen/moveGeneration.ts";
import { kingMoves } from "./moveGen/majorPieces.ts";
import { opponent } from "./helpers/opponent.ts";
import { applyMove, unapplyMove } from "./moveMaking/applyMove.ts";
import {
  undoPieceIndexUpdate,
  updatePieceIndexes,
} from "./positionStates/pieceIndexUpdators.ts";
import { updateCastlingRights } from "./moveMaking/castling.ts";
import type { Undo } from "./moveMaking/move.ts";
import { isKing, isPawn } from "./pieceUtils/pieceClassifiers.ts";
import {
  buildBitboards,
  buildCastlingRights,
  buildEnPassantSquare,
  buildFenBoard,
  buildFenCastling,
  buildFenEnPassant,
  buildPlayer,
} from "./fenAndUCI/fenHelpers.ts";
import {
  undoOccupancyUpdate,
  updateOccupancy,
} from "./positionStates/occupancy.ts";
import { getMovesFromBB, newEnPassant } from "./moveMaking/moveHelpers.ts";
import { getCheckers } from "./moveGen/getCheckers.ts";

export class Position {
  bitboards: BigUint64Array;
  playerOcc: Bitboard[];
  occupied: Bitboard;

  pieceAt: Piece[]; // length 64
  pieceIndexes: Square[][];

  sideToMove: Player;
  castlingRights: number;
  enPassantSquare: number;
  fullmoveNumber: number;

  result: Result;
  halfmoveClock: number;
  endState: EndState;

  kingSq: Int8Array; // Indexed by player
  zobristKey: bigint;

  moveStack: Move[];
  undoStack: Undo[];
  pastPositions: Map<bigint, number>;

  constructor() {
    // ----- Board State -----
    this.bitboards = new BigUint64Array(NUM_PIECES);
    this.playerOcc = new Array(2).fill(0n);
    this.occupied = 0n;

    this.pieceAt = new Array(64).fill(NO_PIECE);
    this.pieceIndexes = Array.from({ length: NUM_PIECES }, () => new Array());

    // ----- Game State -----
    this.sideToMove = WHITE;
    this.castlingRights = ALL_CASTLING;
    this.enPassantSquare = NO_SQUARE;
    this.fullmoveNumber = 1;

    // ----- End Game -----
    this.result = IN_PROGRESS;
    this.halfmoveClock = 0;
    this.endState = IN_PROGRESS;

    // ----- Cached Info -----
    this.kingSq = new Int8Array(2);
    this.zobristKey = 0n;

    this.moveStack = [];
    this.undoStack = [];
    this.pastPositions = new Map<bigint, number>();

    this.loadInitialPosition();
  }

  loadInitialPosition(): void {
    this.bitboards.set(INITIAL_BITBOARDS);

    this.pieceAt.fill(NO_PIECE);

    this.initCurrentPosition();
  }

  initCurrentPosition() {
    this.kingSq[WHITE] = bitScanForward(this.bitboards[WHITE_KING]);
    this.kingSq[BLACK] = bitScanForward(this.bitboards[BLACK_KING]);

    this.endState = IN_PROGRESS;
    this.result = IN_PROGRESS;

    this.recomputeOccupancy();
    this.computeZobrist();
    this.initializePieceAt();
    this.initializePieceIndexes();
  }

  initializePieceAt(): void {
    this.pieceAt.fill(NO_PIECE);

    for (const piece of PIECES) {
      let bb = this.bitboards[piece];
      while (bb) {
        const sq = bitScanForward(bb);
        this.pieceAt[sq] = piece;
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

  recomputeOccupancy(): void {
    let whiteOcc = 0n;
    let blackOcc = 0n;

    for (let p = 0; p < 6; p++) {
      whiteOcc |= this.bitboards[p];
      blackOcc |= this.bitboards[p + 6];
    }

    this.occupied = whiteOcc | blackOcc;
    this.playerOcc[WHITE] = whiteOcc;
    this.playerOcc[BLACK] = blackOcc;
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
   * Creates new zobrist key for the position by updating the old hash
   */
  updateZobrist(move: Move, prevEpSq: Square, prevCastling: number): void {
    let newHash = this.zobristKey;
    const from = move.from;
    const to = move.to;
    const captured = move.captured;

    // XOR the piece at the previous position
    const zobristFrom = zobristTable[move.piece * 64 + from];
    newHash ^= zobristFrom;

    // XOR the pieces new location
    const pieceTo = move.promotion === NO_PIECE ? move.piece : move.promotion;
    const zobristTo = zobristTable[pieceTo * 64 + to];
    newHash ^= zobristTo;

    // if a capture, XOR to remove captured piece
    if (captured !== NO_PIECE) {
      let captSq = to;
      if (move.enPassant) {
        captSq = move.piece < 6 ? captSq - 8 : captSq + 8;
      }
      const zobristCaptured = zobristTable[captured * 64 + captSq];
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

    this.zobristKey = newHash;
  }

  updateHalfmoveClock(move: Move): void {
    if (move.captured !== NO_PIECE || isPawn(move.piece)) {
      this.halfmoveClock = 0;
    } else {
      this.halfmoveClock++;
    }
  }

  // -----------------------
  // Core rule methods
  // -----------------------

  generatePseudoLegalMoves(side: Player = this.sideToMove): Move[] {
    let moves = [];

    const isWhite = side === WHITE;
    const opp = opponent(side);

    const kingSq = this.kingSq[side];

    // If king is in check
    const isKingInCheck = this.isSquareAttacked(kingSq, opp);
    if (isKingInCheck) {
      const checkers = getCheckers(this, side);
      const numCheck = popcount(checkers);

      // Double check, only king moves are possible
      if (numCheck > 1) {
        const moves = kingMoves(this, kingSq);

        return getMovesFromBB(
          moves,
          kingSq,
          isWhite ? WHITE_KING : BLACK_KING,
          this.enPassantSquare,
          side,
          this.pieceAt,
        );
      }
      if (numCheck !== 1) {
        throw new Error("KING IN CHECK W/O CHECKERS");
      }
    }

    const playerIndicies = this.playerPieceIndexes(side);
    for (const pieceIdxArr of playerIndicies) {
      for (const square of pieceIdxArr) {
        const piece = this.pieceAt[square];

        const moveBB = getPieceMoves(this, piece, square);
        if (moveBB === 0n) continue;

        const moveArr = getMovesFromBB(
          moveBB,
          square,
          piece,
          this.enPassantSquare,
          side,
          this.pieceAt,
        );

        moves = moves.concat(moveArr);
      }
    }

    return moves;
  }

  generateLegalMoves(side: Player = this.sideToMove): Move[] {
    const legal = [];

    const movingSide = side;
    const moves = this.generatePseudoLegalMoves(movingSide);
    for (const move of moves) {
      this.makeMove(move);
      if (this.isInCheck(movingSide)) {
        this.unmakeMove();
        continue;
      }
      this.unmakeMove();
      legal.push(move);
    }

    return legal;
  }

  makeMove(move: Move): void {
    if (this.gameOver()) {
      return;
    }

    const undo: Undo = {
      captured: this.pieceAt[move.to],
      castlingRights: this.castlingRights,
      epSquare: this.enPassantSquare,
      halfmoveClock: this.halfmoveClock,
      zobristKey: this.zobristKey,
    };
    this.undoStack.push(undo);
    this.moveStack.push(move);

    applyMove(this, move);

    updatePieceIndexes(this.pieceIndexes, move);
    updateOccupancy(this, move);

    if (isKing(move.piece)) {
      this.kingSq[this.sideToMove] = move.to;
    }

    const epSq = this.enPassantSquare;
    const rights = this.castlingRights;
    this.enPassantSquare = newEnPassant(move);
    this.castlingRights = updateCastlingRights(
      move.from,
      move.to,
      this.castlingRights,
    );
    this.updateZobrist(move, epSq, rights);

    this.updateHalfmoveClock(move);
    if (this.sideToMove === BLACK) {
      this.fullmoveNumber++;
    }

    const prev = this.pastPositions.get(this.zobristKey) ?? 0;
    this.pastPositions.set(this.zobristKey, prev + 1);

    this.sideToMove ^= 1;
  }

  unmakeMove(): void {
    const undo = this.undoStack.pop();
    const move = this.moveStack.pop();
    unapplyMove(this, move);

    this.sideToMove ^= 1;

    undoPieceIndexUpdate(this.pieceIndexes, move);
    undoOccupancyUpdate(this, move);

    if (isKing(move.piece)) {
      this.kingSq[this.sideToMove] = move.from;
    }

    const prev = this.pastPositions.get(this.zobristKey);
    if (prev === 1) {
      this.pastPositions.delete(this.zobristKey);
    } else {
      this.pastPositions.set(this.zobristKey, prev - 1);
    }

    this.castlingRights = undo.castlingRights;
    this.enPassantSquare = undo.epSquare;
    this.halfmoveClock = undo.halfmoveClock;
    this.zobristKey = undo.zobristKey;

    if (this.sideToMove === BLACK) {
      this.fullmoveNumber--;
    }

    // If unmaking a move, the game cant be over (can't move if the game is over)
    this.result = IN_PROGRESS;
    this.endState = IN_PROGRESS;
  }

  isInCheck(player: Player = this.sideToMove): boolean {
    const opp = opponent(player);
    const kingSquare = this.kingSq[player];

    return this.isSquareAttacked(kingSquare, opp);
  }

  hasLegalMove(player: Player = this.sideToMove): boolean {
    const moves = this.generateLegalMoves(player);
    return moves.length !== 0;
  }

  checkGameOver() {
    if (drawByInsufficientMaterial(this.bitboards, this.playerOcc)) {
      this.result = DRAW;
      this.endState = INSUFFICIENT_MATERIAL;
      return;
    }
    if (this.halfmoveClock >= 100) {
      this.result = DRAW;
      this.endState = FIFTY_MOVE_RULE;
      return;
    }
    if (drawByRepetition(this.pastPositions)) {
      this.result = DRAW;
      this.endState = REPETITION;
      return;
    }

    // If player has no moves it is stalemate or checkmate
    if (!this.hasLegalMove()) {
      const kingSquare = this.kingSq[this.sideToMove];
      if (this.isSquareAttacked(kingSquare, opponent(this.sideToMove))) {
        this.result = this.sideToMove === WHITE ? BLACK_WIN : WHITE_WIN;
        this.endState = CHECKMATE;
        return;
      }

      this.result = DRAW;
      this.endState = STALEMATE;
    }
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

  isSquareAttacked(square: Square, player: Player): boolean {
    const occ = this.playerOcc[player];
    const allAttacks = attacksTo(this, square);
    return (occ & allAttacks) !== 0n;
  }

  gameOver(): boolean {
    return this.result !== IN_PROGRESS;
  }

  getFen(): String {
    const board = buildFenBoard(this.pieceAt);

    const active = this.sideToMove === WHITE ? "w" : "b";

    const castling = buildFenCastling(this.castlingRights);
    const ep = buildFenEnPassant(this.enPassantSquare);

    const halfmove = this.halfmoveClock;
    const fullmove = this.fullmoveNumber;

    return `${board} ${active} ${castling} ${ep} ${halfmove} ${fullmove}`;
  }

  loadFen(fen: String): void {
    const data = fen.split(" ");
    const bbStr = data[0];
    const playerStr = data[1];
    const castlingStr = data[2];
    const epStr = data[3];
    const halfmove = data[4];
    const fullmove = data[5];

    this.bitboards = buildBitboards(bbStr);
    this.sideToMove = buildPlayer(playerStr);
    this.castlingRights = buildCastlingRights(castlingStr);
    this.enPassantSquare = buildEnPassantSquare(epStr);
    this.halfmoveClock = parseInt(halfmove);
    this.fullmoveNumber = parseInt(fullmove);

    this.initCurrentPosition();
  }

  validate(): boolean {
    // ----- Recompute Occupancy from Bitboards -----
    let union = 0n;

    for (let i = 0; i < this.bitboards.length; i++) {
      union |= this.bitboards[i];
    }

    if (union !== this.occupied) {
      console.error("Occupied mismatch");
      return false;
    }

    // ----- Player Occupancy -----
    const whiteOcc = this.playerOcc[WHITE];
    const blackOcc = this.playerOcc[BLACK];

    if ((whiteOcc & blackOcc) !== 0n) {
      console.error("Overlapping player occupancy");
      return false;
    }

    if ((whiteOcc | blackOcc) !== this.occupied) {
      console.error("Player occupancy mismatch");
      return false;
    }

    // ----- pieceAt[] matches bitboards -----
    for (let sq = 0; sq < 64; sq++) {
      const mask = 1n << BigInt(sq);
      const piece = this.pieceAt[sq];

      let found: Piece = NO_PIECE;

      for (const p of PIECES) {
        if (this.bitboards[p] & mask) {
          found = p;
          break;
        }
      }

      if (found !== piece) {
        console.log(piece, found);
        console.error(`pieceAt mismatch at square ${sq}`);
        return false;
      }
    }

    // ----- No overlapping piece bitboards -----
    for (let i = 0; i < this.bitboards.length; i++) {
      for (let j = i + 1; j < this.bitboards.length; j++) {
        if ((this.bitboards[i] & this.bitboards[j]) !== 0n) {
          console.error("Overlapping piece bitboards");
          return false;
        }
      }
    }

    // ----- Exactly One King Per Side -----
    const whiteKingBB = this.bitboards[WHITE_KING];
    const blackKingBB = this.bitboards[BLACK_KING];

    if (popcount(whiteKingBB) !== 1) {
      console.error("Invalid white king count");
      return false;
    }

    if (popcount(blackKingBB) !== 1) {
      console.error("Invalid black king count");
      return false;
    }

    // ----- -kingSq matches king bitboard -----
    const whiteKingSq = bitScanForward(whiteKingBB);
    const blackKingSq = bitScanForward(blackKingBB);

    if (this.kingSq[WHITE] !== whiteKingSq) {
      console.error("White king square mismatch");
      return false;
    }

    if (this.kingSq[BLACK] !== blackKingSq) {
      console.error("Black king square mismatch");
      return false;
    }

    // ----- Side to Move sanity -----
    if (this.sideToMove !== WHITE && this.sideToMove !== BLACK) {
      console.error("Invalid sideToMove");
      return false;
    }

    return true;
  }

  copy(): Position {
    const cpy = new Position();
    for (const piece of PIECES) {
      cpy.bitboards[piece] = this.bitboards[piece];
    }

    cpy.sideToMove = this.sideToMove;
    cpy.castlingRights = this.castlingRights;
    cpy.enPassantSquare = this.enPassantSquare;

    cpy.fullmoveNumber = this.fullmoveNumber;
    cpy.halfmoveClock = this.halfmoveClock;

    cpy.initCurrentPosition();

    const moveStack: Move[] = [];
    for (const move of this.moveStack) {
      const moveCpy = move.copyWith({});
      moveStack.push(moveCpy);
    }
    cpy.moveStack = moveStack;

    const undoStack: Undo[] = [];
    for (const undo of this.undoStack) {
      const undoCpy = {
        captured: undo.captured,
        castlingRights: undo.castlingRights,
        epSquare: undo.epSquare,
        halfmoveClock: undo.halfmoveClock,
        zobristKey: undo.zobristKey,
      };
      undoStack.push(undoCpy);
    }
    cpy.undoStack = undoStack;

    const pastPositions = new Map<bigint, number>();
    for (const key of this.pastPositions.keys()) {
      pastPositions.set(key, this.pastPositions.get(key));
    }
    cpy.pastPositions = pastPositions;

    return cpy;
  }
}
