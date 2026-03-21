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
  PLAYER_PIECES,
  PROMO_PIECES,
  PROMO_RANK,
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
import { opponent } from "./helpers/opponent.ts";
import { applyMove, unapplyMove } from "./moveMaking/applyMove.ts";
import { updateCastlingRights } from "./moveMaking/castling.ts";
import {
  encodeMove,
  FLAG_CASTLE,
  FLAG_DOUBLE,
  FLAG_EP,
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
  popcount,
  squareBB,
  testBit,
  type Bitboard,
} from "./bb.ts";
import { kingMoves } from "./moveGen/kingMoves.ts";
import {
  bPMasksHi,
  bPMasksLo,
  wPMasksHi,
  wPMasksLo,
} from "./attackMasks/pawnMasks.ts";
import { knightMasksHi, knightMasksLo } from "./attackMasks/knightMasks.ts";

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

  pieceAt: Piece[]; // length 64

  sideToMove: Player;
  castlingRights: CastlingNumber;
  enPassantSquare: Square;
  fullmoveNumber: number;
  ply: number;

  result: Result;
  halfmoveClock: number;
  endState: EndState;

  kingSq: Square[]; // Indexed by player, len 2
  zobristKey: bigint;

  searchPly: number;
  moveBuffer: Uint32Array;

  moveStack: Move[];

  undoCastling: CastlingNumber[];
  undoEp: Square[];
  undoHalfmove: number[];

  zobristHistory: BigUint64Array;

  constructor() {
    // ----- Board State -----
    this.bbsHi = new Int32Array(PIECE_N);
    this.bbsLo = new Int32Array(PIECE_N);

    this.playerOccLo = new Int32Array(2);
    this.playerOccHi = new Int32Array(2);
    this.occupiedLo = 0;
    this.occupiedHi = 0;

    this.pieceAt = new Array(64).fill(NO_PIECE);

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
    this.kingSq = new Array<Square>(2);
    this.zobristKey = 0n;

    this.searchPly = 0;
    this.moveBuffer = new Uint32Array(MAX_SEARCH_PLY * MAX_MOVES);

    this.moveStack = new Array<Move>(MAX_PLY);

    this.undoCastling = new Array<CastlingNumber>(MAX_PLY);
    this.undoEp = new Array<Square>(MAX_PLY);
    this.undoHalfmove = new Array<number>(MAX_PLY);

    this.zobristHistory = new BigUint64Array(MAX_PLY);

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

    this.zobristHistory[0] = this.zobristKey;
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

    // Pieces
    for (const piece of PIECES) {
      let lo = this.bbsLo[piece];
      let hi = this.bbsHi[piece];
      while (!bbIsEmpty(lo, hi)) {
        const sq = lsb(lo, hi);
        key ^= zobristTable[piece * 64 + sq];

        if (lo !== 0) lo &= lo - 1;
        else hi &= hi - 1;
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
  updateZobrist(
    move: Move,
    prevEpSq: Square,
    prevCastling: CastlingNumber,
  ): void {
    let newHash = this.zobristKey;
    const from = moveFrom(move);
    const to = moveTo(move);
    const piece = movePiece(move);
    const captured = moveCaptured(move);

    // XOR the piece at the previous position
    const zobristFrom = zobristTable[piece * 64 + from];
    newHash ^= zobristFrom;

    // XOR the pieces new location
    const promo = movePromotion(move);
    const pieceTo = promo === NO_PIECE ? piece : promo;
    const zobristTo = zobristTable[pieceTo * 64 + to];
    newHash ^= zobristTo;

    // if a capture, XOR to remove captured piece
    if (captured !== NO_PIECE) {
      let captSq = to as number;
      if (isEnPassant(move)) {
        captSq = isWhite(piece) ? captSq - 8 : captSq + 8;
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

    if (isCastling(move)) {
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
    const start = this.searchPly * MAX_MOVES;
    let count = 0;

    const side = this.sideToMove;

    const kingSq = this.kingSq[side];

    // If king is in check
    if (this.isSquareAttacked(kingSq, opponent(side))) {
      const [cLo, cHi] = getCheckers(this, side);
      const numCheck = popcount(cLo, cHi);

      // Double check, only king moves are possible
      if (numCheck > 1) {
        let [kMoveLo, kMoveHi] = kingMoves(this, kingSq);
        const piece = side === WHITE ? WHITE_KING : BLACK_KING;

        while (kMoveLo || kMoveHi) {
          const to = lsb(kMoveLo, kMoveHi);

          const captured = this.pieceAt[to];
          this.moveBuffer[start + count++] = encodeMove(
            kingSq,
            to,
            piece,
            captured,
          );

          if (kMoveLo !== 0) kMoveLo &= kMoveLo - 1;
          else kMoveHi &= kMoveHi - 1;
        }
        return count;
      }
      if (numCheck !== 1) {
        throw new Error("KING IN CHECK W/O CHECKERS");
      }
    }

    const pieces = PLAYER_PIECES[side];
    const bbsLo = this.bbsLo;
    const bbsHi = this.bbsHi;
    const pieceAt = this.pieceAt;
    const buffer = this.moveBuffer;

    const promoRank = PROMO_RANK[side];
    const promoList = PROMO_PIECES[side];
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];

      let lo = bbsLo[piece];
      let hi = bbsHi[piece];
      while (lo || hi) {
        const from = lsb(lo, hi);

        if (lo !== 0) lo &= lo - 1;
        else hi &= hi - 1;

        let [movesLo, movesHi] = getPieceMoves(this, piece, from);
        while (movesLo || movesHi) {
          const to = lsb(movesLo, movesHi);

          if (movesLo) movesLo &= movesLo - 1;
          else movesHi &= movesHi - 1;

          let captured = pieceAt[to];

          let flags = 0;

          // ----- Pawn logic -----
          if (piece === WHITE_PAWN || piece === BLACK_PAWN) {
            let delta = from - to;
            if (delta < 0) delta = -delta;

            if (delta === 16) {
              flags |= FLAG_DOUBLE;
            } else if (delta !== 8 && captured === NO_PIECE) {
              flags |= FLAG_EP;
              captured = side === WHITE ? BLACK_PAWN : WHITE_PAWN;
            }

            // Promotion
            if (to >> 3 === promoRank) {
              for (let k = 0; k < promoList.length; k++) {
                buffer[start + count++] = encodeMove(
                  from,
                  to,
                  piece,
                  captured,
                  promoList[k],
                  flags,
                );
              }

              continue;
            }
          }

          // ----- Castling -----
          else if (piece === WHITE_KING || piece === BLACK_KING) {
            if (Math.abs(from - to) === 2) {
              flags |= FLAG_CASTLE;
            }
          }

          buffer[start + count++] = encodeMove(
            from,
            to,
            piece,
            captured,
            NO_PIECE,
            flags,
          );
        }
      }
    }

    return count;
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

    this.zobristHistory[this.ply] = this.zobristKey;

    this.sideToMove ^= 1;
    this.searchPly++;
  }

  unmakeMove(): void {
    this.searchPly--;

    const castling = this.undoCastling[this.ply];
    const ep = this.undoEp[this.ply];
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
    this.zobristKey = this.zobristHistory[this.ply - 1]; // get prev position key

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
    const kingSquare = this.kingSq[player];

    return this.isSquareAttacked(kingSquare, opp);
  }

  hasLegalMove(): boolean {
    const start = this.searchPly * MAX_MOVES;
    const pseudoCount = this.generatePseudoLegalMoves();
    const side = this.sideToMove;
    for (let i = 0; i < pseudoCount; i++) {
      const move = this.moveBuffer[start + i];

      this.makeMove(move);

      if (!this.isInCheck(side)) {
        this.unmakeMove();
        return true;
      }

      this.unmakeMove();
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
    if (drawByRepetition(this.zobristHistory, this.halfmoveClock, this.ply)) {
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
  isPlayersPieceAt(square: Square, player: Player): boolean {
    const p = this.pieceAt[square];
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
    const kingSq = this.kingSq[side];

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
    const kingSq = this.kingSq[side];
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

    cpy.moveBuffer = new Uint32Array(this.moveBuffer);

    const moveStack: Move[] = [];
    for (const move of this.moveStack) {
      moveStack.push(move);
    }
    cpy.moveStack = moveStack;

    cpy.undoCastling = this.undoCastling.slice();
    cpy.undoEp = this.undoEp.slice();
    cpy.undoHalfmove = this.undoHalfmove.slice();

    cpy.ply = this.ply;
    cpy.searchPly = this.searchPly;

    cpy.zobristHistory = this.zobristHistory.slice();

    return cpy;
  }
}
