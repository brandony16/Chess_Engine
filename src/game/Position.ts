import { attacksTo } from "./attackMasks/attackMasks.ts";
import {
  ALL_CASTLING,
  BLACK,
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
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
  PIECE_N,
  PIECES,
  REPETITION,
  STALEMATE,
  WHITE,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
  WHITE_WIN,
  type CastlingNumber,
  type EndState,
  type Piece,
  type Player,
  type Result,
  type Square,
} from "./chessConstants.ts";
import {
  CASTLING_ZOBRIST_HI,
  CASTLING_ZOBRIST_LO,
  EN_PASSANT_ZOBRIST_HI,
  EN_PASSANT_ZOBRIST_LO,
  SIDE_ZOBRIST_HI,
  SIDE_ZOBRIST_LO,
  zobristTableHi,
  zobristTableLo,
} from "./positionStates/zobrist.ts";
import {
  drawByInsufficientMaterial,
  drawByRepetition,
} from "./positionStates/gameOverLogic.ts";
import { opponent } from "./helpers/opponent.ts";
import { applyMove, unapplyMove } from "./moveMaking/applyMove.ts";
import { updateCastlingRights } from "./moveMaking/castling.ts";
import {
  isCastling,
  isEnPassant,
  moveCaptured,
  moveFrom,
  movePiece,
  movePromotion,
  moveTo,
  type Move,
} from "./moveMaking/move.ts";
import { isKing, isPawn, isWhite } from "./pieceUtils/pieceClassifiers.ts";
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
import { newEnPassant } from "./moveMaking/moveHelpers.ts";
import { getCheckers } from "./moveGen/getCheckers.ts";
import { bishopAttacks, rookAttacks } from "./moveGen/sliderMoves.ts";
import {
  betweenMaskHi,
  betweenMaskLo,
  lineMaskHi,
  lineMaskLo,
} from "./attackMasks/masks.ts";
import {
  bbFromBigInt,
  bbIsEmpty,
  bbNotEmpty,
  bbOr,
  clearBit,
  exactlyOne,
  lsb,
  moreThanOne,
  popcount,
  squareBB,
  testBit,
  type Bitboard,
} from "./bb.ts";
import {
  bPMasksHi,
  bPMasksLo,
  wPMasksHi,
  wPMasksLo,
} from "./attackMasks/pawnMasks.ts";
import { knightMasksHi, knightMasksLo } from "./attackMasks/knightMasks.ts";
import {
  generateBishopMoves,
  generateKingMoves,
  generateKnightMoves,
  generatePawnMoves,
  generateQueenMoves,
  generateRookMoves,
} from "./moveGen/totalPieceGen.ts";

const MAX_SEARCH_PLY = 16;
const MAX_PLY = 512;
export const MAX_MOVES = 256;

export class Position {
  bbsHi: Int32Array;
  bbsLo: Int32Array;

  playerOccLo: Int32Array;
  playerOccHi: Int32Array;
  occupiedLo: number;
  occupiedHi: number;

  pieceAt: Int8Array; // length 64

  sideToMove: Player;
  castlingRights: CastlingNumber;
  enPassantSquare: Square;
  fullmoveNumber: number;
  ply: number;

  result: Result;
  halfmoveClock: number;
  endState: EndState;

  kingSq: Int8Array; // Indexed by player, len 2

  searchPly: number;
  moveBuffer: Uint32Array;

  moveStack: Int32Array;

  undoCastling: Int8Array;
  undoEp: Int8Array;
  undoHalfmove: Int32Array;

  zobristLo: number;
  zobristHi: number;

  zobristHistoryLo: Uint32Array;
  zobristHistoryHi: Uint32Array;

  constructor() {
    // ----- Board State -----
    this.bbsHi = new Int32Array(PIECE_N);
    this.bbsLo = new Int32Array(PIECE_N);

    this.playerOccLo = new Int32Array(2);
    this.playerOccHi = new Int32Array(2);
    this.occupiedLo = 0;
    this.occupiedHi = 0;

    this.pieceAt = new Int8Array(64).fill(NO_PIECE);

    // ----- Game State -----
    this.sideToMove = WHITE;
    this.castlingRights = ALL_CASTLING;
    this.enPassantSquare = NO_SQUARE;
    this.fullmoveNumber = 1;
    this.ply = 0;

    // ----- End Game -----
    this.result = IN_PROGRESS;
    this.halfmoveClock = 0;
    this.endState = IN_PROGRESS;

    // ----- Cached Info -----
    this.kingSq = new Int8Array(2);
    this.zobristLo = 0;
    this.zobristHi = 0;

    this.searchPly = 0;
    this.moveBuffer = new Uint32Array(MAX_SEARCH_PLY * MAX_MOVES);

    this.moveStack = new Int32Array(MAX_PLY);

    this.undoCastling = new Int8Array(MAX_PLY);
    this.undoEp = new Int8Array(MAX_PLY);
    this.undoHalfmove = new Int32Array(MAX_PLY);

    this.zobristHistoryLo = new Uint32Array(MAX_PLY);
    this.zobristHistoryHi = new Uint32Array(MAX_PLY);

    this.loadInitialPosition();
  }

  loadInitialPosition(): void {
    for (const piece of PIECES) {
      const bb = INITIAL_BITBOARDS[piece];
      const [lo, hi] = bbFromBigInt(bb);
      this.bbsLo[piece] = lo;
      this.bbsHi[piece] = hi;
    }

    this.pieceAt.fill(NO_PIECE);

    this.initCurrentPosition();
  }

  initCurrentPosition(): void {
    this.kingSq[WHITE] = lsb(this.bbsLo[WHITE_KING], this.bbsHi[WHITE_KING]);
    this.kingSq[BLACK] = lsb(this.bbsLo[BLACK_KING], this.bbsHi[BLACK_KING]);

    this.endState = IN_PROGRESS;
    this.result = IN_PROGRESS;

    this.recomputeOccupancy();
    this.computeZobrist();
    this.initializePieceAt();

    this.zobristHistoryLo[0] = this.zobristLo;
    this.zobristHistoryHi[0] = this.zobristHi;
  }

  initializePieceAt(): void {
    this.pieceAt.fill(NO_PIECE);

    for (const piece of PIECES) {
      let lo = this.bbsLo[piece];
      let hi = this.bbsHi[piece];

      while (!bbIsEmpty(lo, hi)) {
        const sq = lsb(lo, hi);
        this.pieceAt[sq] = piece;

        if (lo !== 0) lo &= lo - 1;
        else hi &= hi - 1;
      }
    }
  }

  recomputeOccupancy(): void {
    let wOccLo = 0,
      wOccHi = 0;
    let bOccLo = 0,
      bOccHi = 0;

    for (const piece of PIECES) {
      if (isWhite(piece)) {
        wOccLo |= this.bbsLo[piece];
        wOccHi |= this.bbsHi[piece];
      } else {
        bOccLo |= this.bbsLo[piece];
        bOccHi |= this.bbsHi[piece];
      }
    }

    this.occupiedLo = wOccLo | bOccLo;
    this.occupiedHi = wOccHi | bOccHi;

    this.playerOccLo[WHITE] = wOccLo;
    this.playerOccHi[WHITE] = wOccHi;
    this.playerOccLo[BLACK] = bOccLo;
    this.playerOccHi[BLACK] = bOccHi;
  }

  computeZobrist(): bigint {
    let key = 0n;
    let keyLo = 0,
      keyHi = 0;

    // Pieces
    for (const piece of PIECES) {
      let lo = this.bbsLo[piece];
      let hi = this.bbsHi[piece];
      while (!bbIsEmpty(lo, hi)) {
        const sq = lsb(lo, hi);
        const idx = piece * 64 + sq;
        keyLo ^= zobristTableLo[idx];
        keyHi ^= zobristTableHi[idx];

        if (lo !== 0) lo &= lo - 1;
        else hi &= hi - 1;
      }
    }

    // Side to move
    if (this.sideToMove === BLACK) {
      keyLo ^= SIDE_ZOBRIST_LO;
      keyHi ^= SIDE_ZOBRIST_HI;
    }

    // Castling rights
    keyLo ^= CASTLING_ZOBRIST_LO[this.castlingRights];
    keyHi ^= CASTLING_ZOBRIST_HI[this.castlingRights];

    // En passant (file-based)
    if (this.enPassantSquare !== NO_SQUARE) {
      // & 7 gives the column
      keyLo ^= EN_PASSANT_ZOBRIST_LO[this.enPassantSquare & 7];
      keyHi ^= EN_PASSANT_ZOBRIST_HI[this.enPassantSquare & 7];
    }

    this.zobristLo = keyLo >>> 0;
    this.zobristHi = keyHi >>> 0;
    return key;
  }

  /**
   * Creates new zobrist key for the position by updating the old hash
   */
  updateZobrist(
    move: Move,
    prevEpSq: Square,
    prevCastling: CastlingNumber,
  ): void {
    let hashLo = this.zobristLo;
    let hashHi = this.zobristHi;
    const from = moveFrom(move);
    const to = moveTo(move);
    const piece = movePiece(move);
    const captured = moveCaptured(move);

    // XOR the piece at the previous position
    const idxFrom = piece * 64 + from;
    hashLo ^= zobristTableLo[idxFrom];
    hashHi ^= zobristTableHi[idxFrom];

    // XOR the pieces new location
    const promo = movePromotion(move);
    const pieceTo = promo === NO_PIECE ? piece : promo;
    const idxTo = pieceTo * 64 + to;
    hashLo ^= zobristTableLo[idxTo];
    hashHi ^= zobristTableHi[idxTo];

    // if a capture, XOR to remove captured piece
    if (captured !== NO_PIECE) {
      let captSq = to as number;
      if (isEnPassant(move)) {
        captSq = isWhite(piece) ? captSq - 8 : captSq + 8;
      }
      const idxCap = captured * 64 + captSq;
      hashLo ^= zobristTableLo[idxCap];
      hashHi ^= zobristTableHi[idxCap];
    }

    // XOR player
    hashLo ^= SIDE_ZOBRIST_LO;
    hashHi ^= SIDE_ZOBRIST_HI;

    if (prevEpSq !== this.enPassantSquare) {
      if (prevEpSq !== NO_SQUARE) {
        const prevEpFile = prevEpSq & 7;
        hashLo ^= EN_PASSANT_ZOBRIST_LO[prevEpFile];
        hashHi ^= EN_PASSANT_ZOBRIST_HI[prevEpFile];
      }

      if (this.enPassantSquare !== NO_SQUARE) {
        const newEpFile = this.enPassantSquare & 7;
        hashLo ^= EN_PASSANT_ZOBRIST_LO[newEpFile];
        hashHi ^= EN_PASSANT_ZOBRIST_HI[newEpFile];
      }
    }

    if (isCastling(move)) {
      // King must move from square 4 if white is castling
      const isWhite = from === 4;
      const rook = isWhite ? WHITE_ROOK : BLACK_ROOK;

      // Queenside
      if (from > to) {
        const rookFrom = isWhite ? 0 : 56;
        const fromIdx = rook * 64 + rookFrom;
        hashLo ^= zobristTableLo[fromIdx];
        hashHi ^= zobristTableHi[fromIdx];

        const rookTo = rookFrom + 3;
        const toIdx = rook * 64 + rookTo;
        hashLo ^= zobristTableLo[toIdx];
        hashHi ^= zobristTableHi[toIdx];
      } else {
        // Kingside
        const rookFrom = isWhite ? 7 : 63;
        const fromIdx = rook * 64 + rookFrom;
        hashLo ^= zobristTableLo[fromIdx];
        hashHi ^= zobristTableHi[fromIdx];

        const rookTo = rookFrom - 2;
        const toIdx = rook * 64 + rookTo;
        hashLo ^= zobristTableLo[toIdx];
        hashHi ^= zobristTableHi[toIdx];
      }
    }

    if (prevCastling !== this.castlingRights) {
      hashLo ^= CASTLING_ZOBRIST_LO[prevCastling];
      hashHi ^= CASTLING_ZOBRIST_HI[prevCastling];
      hashLo ^= CASTLING_ZOBRIST_LO[this.castlingRights];
      hashHi ^= CASTLING_ZOBRIST_HI[this.castlingRights];
    }

    this.zobristLo = hashLo >>> 0;
    this.zobristHi = hashHi >>> 0;
  }

  updateHalfmoveClock(move: Move): void {
    if (moveCaptured(move) !== NO_PIECE || isPawn(movePiece(move))) {
      this.halfmoveClock = 0;
    } else {
      this.halfmoveClock++;
    }
  }

  // -----------------------
  // Core rule methods
  // -----------------------

  generatePseudoLegalMoves(): number {
    let start = this.searchPly * MAX_MOVES;

    const pawnCount = generatePawnMoves(this, start);
    start += pawnCount;

    const knightCount = generateKnightMoves(this, start);
    start += knightCount;

    const bishopCount = generateBishopMoves(this, start);
    start += bishopCount;

    const rookCount = generateRookMoves(this, start);
    start += rookCount;

    const queenCount = generateQueenMoves(this, start);
    start += queenCount;

    const kingCount = generateKingMoves(this, start);

    return (
      pawnCount + knightCount + bishopCount + rookCount + queenCount + kingCount
    );
  }

  generateLegalMoves(): number {
    const pseudoCount = this.generatePseudoLegalMoves();

    const start = this.searchPly * MAX_MOVES;
    let legalCount = 0;

    const side = this.sideToMove;
    for (let i = 0; i < pseudoCount; i++) {
      const move = this.moveBuffer[start + i];

      this.makeMove(move);

      if (!this.isInCheck(side)) {
        this.moveBuffer[start + legalCount++] = move;
      }

      this.unmakeMove();
    }

    return legalCount;
  }

  isLegal(
    move: Move,
    checkers: Bitboard,
    pinned: Bitboard,
    inDoubleCheck: boolean,
  ) {
    const side = this.sideToMove;
    const from = moveFrom(move);
    const to = moveTo(move);
    const piece = movePiece(move);
    const kingSq = this.kingSq[side];
    const opp = (side ^ 1) as Player;

    const [cLo, cHi] = checkers;
    const [pLo, pHi] = pinned;

    // --- King moves ---
    if (piece === WHITE_KING || piece === BLACK_KING) {
      // Remove king from occupied so king doesnt block rays
      const [occLo, occHi] = clearBit(this.occupiedLo, this.occupiedHi, kingSq);
      const [attLo, attHi] = attacksTo(
        this.bbsLo,
        this.bbsHi,
        occLo,
        occHi,
        to,
      );
      return (
        (attLo & this.playerOccLo[opp]) === 0 &&
        (attHi & this.playerOccHi[opp]) === 0
      );
    }

    // --- Double check: only king moves are legal ---
    if (inDoubleCheck) return false;

    // --- En passant: rare edge case, fall back to make/unmake ---
    if (isEnPassant(move)) {
      this.makeMove(move);
      if (!this.isInCheck(side)) {
        this.unmakeMove();
        return true;
      }
      this.unmakeMove();
      return false;
    }

    // --- Single check: must capture checker or block ---
    if (bbNotEmpty(cLo, cHi)) {
      const checkerSq = lsb(cLo, cHi);

      const maskIdx = kingSq * 64 + checkerSq;
      const betweenHi = betweenMaskHi[maskIdx];
      const betweenLo = betweenMaskLo[maskIdx];

      const [validLo, validHi] = bbOr(cLo, cHi, betweenLo, betweenHi);
      if (!testBit(validLo, validHi, to)) return false;
    }

    // --- Pinned piece: can only move along the pin ray ---
    if (testBit(pLo, pHi, from)) {
      const maskIdx = kingSq * 64 + from;
      const lineHi = lineMaskHi[maskIdx];
      const lineLo = lineMaskLo[maskIdx];

      // Legal only if moving along the line king->pinner
      if (!testBit(lineLo, lineHi, to)) return false;
    }

    return true;
  }

  makeMove(move: Move): void {
    this.ply++;

    const from = moveFrom(move);
    const to = moveTo(move);

    this.undoCastling[this.ply] = this.castlingRights;
    this.undoEp[this.ply] = this.enPassantSquare;
    this.undoHalfmove[this.ply] = this.halfmoveClock;

    this.moveStack[this.ply] = move;

    applyMove(this, move);

    updateOccupancy(this, move);

    if (isKing(movePiece(move))) {
      this.kingSq[this.sideToMove] = to;
    }

    const epSq = this.enPassantSquare;
    const rights = this.castlingRights;
    this.enPassantSquare = newEnPassant(move);
    this.castlingRights = updateCastlingRights(from, to, this.castlingRights);
    this.updateZobrist(move, epSq, rights);

    this.updateHalfmoveClock(move);
    if (this.sideToMove === BLACK) {
      this.fullmoveNumber++;
    }

    this.zobristHistoryLo[this.ply] = this.zobristLo;
    this.zobristHistoryHi[this.ply] = this.zobristHi;

    this.sideToMove ^= 1;
    this.searchPly++;
  }

  unmakeMove(): void {
    this.searchPly--;

    const castling = this.undoCastling[this.ply] as CastlingNumber;
    const ep = this.undoEp[this.ply] as Square;
    const halfmove = this.undoHalfmove[this.ply];
    const move = this.moveStack[this.ply];

    unapplyMove(this, move);

    this.sideToMove ^= 1;

    undoOccupancyUpdate(this, move);

    if (isKing(movePiece(move))) {
      this.kingSq[this.sideToMove] = moveFrom(move);
    }

    this.castlingRights = castling;
    this.enPassantSquare = ep;
    this.halfmoveClock = halfmove;
    this.zobristLo = this.zobristHistoryLo[this.ply - 1];
    this.zobristHi = this.zobristHistoryHi[this.ply - 1];

    if (this.sideToMove === BLACK) {
      this.fullmoveNumber--;
    }

    // If unmaking a move, the game cant be over (can't move if the game is over)
    this.result = IN_PROGRESS;
    this.endState = IN_PROGRESS;
    this.ply--;
  }

  isInCheck(player: Player = this.sideToMove): boolean {
    const opp = opponent(player);
    const kingSquare = this.kingSq[player] as Square;

    return this.isSquareAttacked(kingSquare, opp);
  }

  hasLegalMove(): boolean {
    const start = this.searchPly * MAX_MOVES;
    const pseudoCount = this.generatePseudoLegalMoves();
    const checkers = this.getCheckers();
    const pinned = this.getPinnedPieces();
    const inDoubleCheck = moreThanOne(checkers[0], checkers[1]);
    for (let i = 0; i < pseudoCount; i++) {
      const move = this.moveBuffer[start + i];

      if (this.isLegal(move, checkers, pinned, inDoubleCheck)) return true;
    }

    return false;
  }

  checkGameOver() {
    if (
      drawByInsufficientMaterial(
        this.bbsLo,
        this.bbsHi,
        this.playerOccLo,
        this.playerOccHi,
      )
    ) {
      this.result = DRAW;
      this.endState = INSUFFICIENT_MATERIAL;
      return;
    }
    if (this.halfmoveClock >= 100) {
      this.result = DRAW;
      this.endState = FIFTY_MOVE_RULE;
      return;
    }
    if (
      drawByRepetition(
        this.zobristHistoryLo,
        this.zobristHistoryHi,
        this.halfmoveClock,
        this.ply,
      )
    ) {
      this.result = DRAW;
      this.endState = REPETITION;
      return;
    }

    // If player has no moves it is stalemate or checkmate
    if (!this.hasLegalMove()) {
      const kingSquare = this.kingSq[this.sideToMove] as Square;
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
  isPlayersPieceAt(square: Square, player: Player): boolean {
    const p = this.pieceAt[square] as Piece;
    if (p === NO_PIECE) return false;

    return player === WHITE ? isWhite(p) : !isWhite(p);
  }

  isSquareAttacked(square: Square, player: Player): boolean {
    const [lo, hi] = attacksTo(
      this.bbsLo,
      this.bbsHi,
      this.occupiedLo,
      this.occupiedHi,
      square,
    );

    return (
      (this.playerOccLo[player] & lo) !== 0 ||
      (this.playerOccHi[player] & hi) !== 0
    );
  }

  gameOver(): boolean {
    return this.result !== IN_PROGRESS;
  }

  getCheckers(): Bitboard {
    const side = this.sideToMove;
    const kingSq = this.kingSq[side] as Square;

    const bbsLo = this.bbsLo;
    const bbsHi = this.bbsHi;
    const occLo = this.occupiedLo;
    const occHi = this.occupiedHi;

    let attackersLo = 0,
      attackersHi = 0;

    // Pawns
    const pawn = side === WHITE ? BLACK_PAWN : WHITE_PAWN;
    const maskLo = side === WHITE ? wPMasksLo : bPMasksLo;
    const maskHi = side === WHITE ? wPMasksHi : bPMasksHi;
    attackersLo |= bbsLo[pawn] & maskLo[kingSq];
    attackersHi |= bbsHi[pawn] & maskHi[kingSq];

    // Knights
    const knight = side === WHITE ? BLACK_KNIGHT : WHITE_KNIGHT;
    attackersLo |= knightMasksLo[kingSq] & bbsLo[knight];
    attackersHi |= knightMasksHi[kingSq] & bbsHi[knight];

    // Sliding Pieces
    const queen = side === WHITE ? BLACK_QUEEN : WHITE_QUEEN;
    const rook = side === WHITE ? BLACK_ROOK : WHITE_ROOK;
    const bishop = side === WHITE ? BLACK_BISHOP : WHITE_BISHOP;

    const queenLo = bbsLo[queen],
      queenHi = bbsHi[queen];
    const rookLo = bbsLo[rook],
      rookHi = bbsHi[rook];
    const bishopLo = bbsLo[bishop],
      bishopHi = bbsHi[bishop];

    const [orthoLo, orthoHi] = rookAttacks(kingSq, occLo, occHi);
    attackersLo |= orthoLo & (queenLo | rookLo);
    attackersHi |= orthoHi & (queenHi | rookHi);

    const [diagLo, diagHi] = bishopAttacks(kingSq, occLo, occHi);
    attackersLo |= diagLo & (queenLo | bishopLo);
    attackersHi |= diagHi & (queenHi | bishopHi);

    return [attackersLo, attackersHi];
  }

  getPinnedPieces(): Bitboard {
    const side = this.sideToMove;
    const kingSq = this.kingSq[side] as Square;
    const opp = side ^ 1;
    const friendlyLo = this.playerOccLo[side];
    const friendlyHi = this.playerOccHi[side];

    let pinnedLo = 0,
      pinnedHi = 0;

    const bbsLo = this.bbsLo;
    const bbsHi = this.bbsHi;

    // Candidate pinners: enemy sliders that share a ray with the king
    const bishop = side === WHITE ? BLACK_BISHOP : WHITE_BISHOP;
    const queen = side === WHITE ? BLACK_QUEEN : WHITE_QUEEN;
    const rook = side === WHITE ? BLACK_ROOK : WHITE_ROOK;
    const queenLo = bbsLo[queen],
      queenHi = bbsHi[queen];
    const rookLo = bbsLo[rook],
      rookHi = bbsHi[rook];
    const bishopLo = bbsLo[bishop],
      bishopHi = bbsHi[bishop];

    const [diagRayLo, diagRayHi] = bishopAttacks(
      kingSq,
      this.playerOccLo[opp],
      this.playerOccHi[opp],
    );
    const diagPinnersLo = diagRayLo & (queenLo | bishopLo);
    const diagPinnersHi = diagRayHi & (queenHi | bishopHi);

    const [orthoRayLo, orthoRayHi] = rookAttacks(
      kingSq,
      this.playerOccLo[opp],
      this.playerOccHi[opp],
    );
    const orthoPinnersLo = orthoRayLo & (queenLo | rookLo);
    const orthoPinnersHi = orthoRayHi & (queenHi | rookHi);

    // For each candidate pinner, check if exactly one friendly piece is between
    let pinnersLo = diagPinnersLo | orthoPinnersLo;
    let pinnersHi = diagPinnersHi | orthoPinnersHi;
    while (pinnersLo || pinnersHi) {
      const pinnerSq = lsb(pinnersLo, pinnersHi);
      if (pinnersLo) pinnersLo &= pinnersLo - 1;
      else pinnersHi &= pinnersHi - 1;

      const betweenHi = betweenMaskHi[kingSq * 64 + pinnerSq];
      const betweenLo = betweenMaskLo[kingSq * 64 + pinnerSq];

      const piecesBetweenLo = betweenLo & this.occupiedLo;
      const piecesBetweenHi = betweenHi & this.occupiedHi;

      // Exactly one piece between king and pinner, and it's friendly = pinned
      if (exactlyOne(piecesBetweenLo, piecesBetweenHi)) {
        if (piecesBetweenLo & friendlyLo || piecesBetweenHi & friendlyHi) {
          pinnedLo |= piecesBetweenLo;
          pinnedHi |= piecesBetweenHi;
        }
      }
    }

    return [pinnedLo, pinnedHi];
  }

  getFen(): string {
    const board = buildFenBoard(this.pieceAt);

    const active = this.sideToMove === WHITE ? "w" : "b";

    const castling = buildFenCastling(this.castlingRights);
    const ep = buildFenEnPassant(this.enPassantSquare);

    const halfmove = this.halfmoveClock;
    const fullmove = this.fullmoveNumber;

    return `${board} ${active} ${castling} ${ep} ${halfmove} ${fullmove}`;
  }

  loadFen(fen: string): void {
    const data = fen.split(" ");
    const bbStr = data[0];
    const playerStr = data[1];
    const castlingStr = data[2];
    const epStr = data[3];
    const halfmove = data[4];
    const fullmove = data[5];

    const bitboards = buildBitboards(bbStr);
    for (const piece of PIECES) {
      const [lo, hi] = bbFromBigInt(bitboards[piece]);
      this.bbsHi[piece] = hi;
      this.bbsLo[piece] = lo;
    }
    this.sideToMove = buildPlayer(playerStr);
    this.castlingRights = buildCastlingRights(castlingStr);
    this.enPassantSquare = buildEnPassantSquare(epStr);
    this.halfmoveClock = parseInt(halfmove);
    this.fullmoveNumber = parseInt(fullmove);

    this.initCurrentPosition();
  }

  validate(): boolean {
    // ----- Recompute Occupancy from Bitboards -----
    let occLo = 0,
      occHi = 0;

    for (let i = 0; i < this.bbsLo.length; i++) {
      ((occLo |= this.bbsLo[i]), (occHi |= this.bbsHi[i]));
    }

    if (occLo !== this.occupiedLo || occHi !== this.occupiedHi) {
      console.error("Occupied mismatch");
      return false;
    }

    // ----- Player Occupancy -----
    const wOccLo = this.playerOccLo[WHITE],
      wOccHi = this.playerOccHi[WHITE];
    const bOccLo = this.playerOccLo[BLACK],
      bOccHi = this.playerOccHi[BLACK];

    if ((wOccLo & bOccLo) !== 0 || (wOccHi & bOccHi) !== 0) {
      console.error("Overlapping player occupancy");
      return false;
    }

    if (
      (wOccLo | bOccLo) !== this.occupiedLo ||
      (wOccHi | bOccHi) !== this.occupiedHi
    ) {
      console.error("Player occupancy mismatch");
      return false;
    }

    // ----- pieceAt[] matches bitboards -----
    for (let sq = 0; sq < 64; sq++) {
      const [maskLo, maskHi] = squareBB(sq);
      const piece = this.pieceAt[sq];

      let found: Piece = NO_PIECE;

      for (const p of PIECES) {
        const lo = this.bbsLo[p];
        const hi = this.bbsHi[p];
        if (lo & maskLo || hi & maskHi) {
          found = p;
          break;
        }
      }

      if (found !== piece) {
        console.error(`pieceAt mismatch at square ${sq}`);
        return false;
      }
    }

    // ----- No overlapping piece bitboards -----
    for (let i = 0; i < this.bbsLo.length; i++) {
      for (let j = i + 1; j < this.bbsLo.length; j++) {
        const lo1 = this.bbsLo[i];
        const hi1 = this.bbsHi[i];
        const lo2 = this.bbsLo[j];
        const hi2 = this.bbsHi[j];
        if ((lo1 & lo2) !== 0 || (hi1 & hi2) !== 0) {
          console.error("Overlapping piece bitboards");
          return false;
        }
      }
    }

    // ----- Exactly One King Per Side -----
    const wKLo = this.bbsLo[WHITE_KING],
      wkHi = this.bbsHi[WHITE_KING];
    const bKLo = this.bbsLo[BLACK_KING],
      bKHi = this.bbsHi[BLACK_KING];

    if (popcount(wKLo, wkHi) !== 1) {
      console.error("Invalid white king count");
      return false;
    }

    if (popcount(bKLo, bKHi) !== 1) {
      console.error("Invalid black king count");
      return false;
    }

    // ----- -kingSq matches king bitboard -----
    const whiteKingSq = lsb(wKLo, wkHi);
    const blackKingSq = lsb(bKLo, bKHi);

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
      cpy.bbsHi[piece] = this.bbsHi[piece];
      cpy.bbsLo[piece] = this.bbsLo[piece];
    }

    cpy.sideToMove = this.sideToMove;
    cpy.castlingRights = this.castlingRights;
    cpy.enPassantSquare = this.enPassantSquare;

    cpy.fullmoveNumber = this.fullmoveNumber;
    cpy.halfmoveClock = this.halfmoveClock;

    cpy.initCurrentPosition();

    cpy.moveBuffer = this.moveBuffer.slice();

    cpy.moveStack = this.moveStack.slice();

    cpy.undoCastling = this.undoCastling.slice();
    cpy.undoEp = this.undoEp.slice();
    cpy.undoHalfmove = this.undoHalfmove.slice();

    cpy.ply = this.ply;
    cpy.searchPly = this.searchPly;

    cpy.zobristHistoryLo = this.zobristHistoryLo.slice();
    cpy.zobristHistoryHi = this.zobristHistoryHi.slice();

    return cpy;
  }
}
