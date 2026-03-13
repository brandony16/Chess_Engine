import { bitScanForward, popcount } from "./helpers/bbUtils.ts";
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
  type Bitboard,
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
import { kingMoves } from "./moveGen/majorPieces.ts";
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
import { blackPawnMasks, whitePawnMasks } from "./attackMasks/pawnMasks.ts";
import { knightMasks } from "./attackMasks/knightMasks.ts";
import { bishopAttacks, rookAttacks } from "./moveGen/sliderMoves.ts";
import {
  betweenMask,
  lineMask,
  moreThanOne,
} from "./attackMasks/checkersAndPinned.ts";

const MAX_SEARCH_PLY = 16;
const MAX_PLY = 512;
export const MAX_MOVES = 256;
const MAX_PIECES = 16;

export class Position {
  bitboards: BigUint64Array;
  playerOcc: Bitboard[];
  occupied: Bitboard;

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
    this.bitboards = new BigUint64Array(PIECE_N);
    this.playerOcc = new Array(2).fill(0n);
    this.occupied = 0n;

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
    this.bitboards.set(INITIAL_BITBOARDS);

    this.pieceAt.fill(NO_PIECE);

    this.initCurrentPosition();
  }

  initCurrentPosition(): void {
    this.kingSq[WHITE] = bitScanForward(this.bitboards[WHITE_KING]);
    this.kingSq[BLACK] = bitScanForward(this.bitboards[BLACK_KING]);

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
      let bb = this.bitboards[piece];
      while (bb) {
        const sq = bitScanForward(bb);
        this.pieceAt[sq] = piece;
        bb &= bb - 1n;
      }
    }
  }

  recomputeOccupancy(): void {
    let whiteOcc = 0n;
    let blackOcc = 0n;

    for (const piece of PIECES) {
      if (isWhite(piece)) {
        whiteOcc |= this.bitboards[piece];
      } else {
        blackOcc |= this.bitboards[piece];
      }
    }

    this.occupied = whiteOcc | blackOcc;
    this.playerOcc[WHITE] = whiteOcc;
    this.playerOcc[BLACK] = blackOcc;
  }

  computeZobrist(): bigint {
    let key = 0n;

    // Pieces
    for (const piece of PIECES) {
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
      const checkers = getCheckers(this, side);
      const numCheck = popcount(checkers);

      // Double check, only king moves are possible
      if (numCheck > 1) {
        let kingMoveBB = kingMoves(this, kingSq);
        const piece = side === WHITE ? WHITE_KING : BLACK_KING;

        while (kingMoveBB) {
          const to = bitScanForward(kingMoveBB);
          kingMoveBB &= kingMoveBB - 1n;

          const captured = this.pieceAt[to];
          this.moveBuffer[start + count++] = encodeMove(
            kingSq,
            to,
            piece,
            captured,
          );
        }
        return count;
      }
      if (numCheck !== 1) {
        throw new Error("KING IN CHECK W/O CHECKERS");
      }
    }

    const pieces = PLAYER_PIECES[side];
    const bitboards = this.bitboards;
    const pieceAt = this.pieceAt;
    const buffer = this.moveBuffer;

    const promoRank = PROMO_RANK[side];
    const promoList = PROMO_PIECES[side];
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      let bb = bitboards[piece];
      while (bb) {
        const from = bitScanForward(bb);
        bb &= bb - 1n;

        let moveBB = getPieceMoves(this, piece, from);
        while (moveBB) {
          const to = bitScanForward(moveBB);
          moveBB &= moveBB - 1n;

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

    // --- King moves ---
    if (piece === WHITE_KING || piece === BLACK_KING) {
      // Remove king from occupied so we don't block his own rays
      // (e.g. king can't step back along a rook's attack ray)
      const occupiedWithoutKing = this.occupied & ~(1n << BigInt(kingSq));
      const attacks = attacksTo(this.bitboards, occupiedWithoutKing, to);
      return (attacks & this.playerOcc[opp]) === 0n;
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
    if (checkers !== 0n) {
      const checkerSq = bitScanForward(checkers);
      const validTargets = checkers | betweenMask[kingSq][checkerSq];
      if (!(validTargets & (1n << BigInt(to)))) return false;
    }

    // --- Pinned piece: can only move along the pin ray ---
    if (pinned & (1n << BigInt(from))) {
      // Legal only if moving along the line king->pinner
      if (!(lineMask[kingSq][from] & (1n << BigInt(to)))) return false;
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
    const allAttacks = attacksTo(this.bitboards, this.occupied, square);

    return (this.playerOcc[player] & allAttacks) !== 0n;
  }

  gameOver(): boolean {
    return this.result !== IN_PROGRESS;
  }

  getCheckers(): bigint {
    const side = this.sideToMove;
    const kingSq = this.kingSq[side];

    const bitboards = this.bitboards;
    const occ = this.occupied;
    let attackers = 0n;

    // Pawns
    const pawn = side === WHITE ? BLACK_PAWN : WHITE_PAWN;
    const mask = side === WHITE ? whitePawnMasks : blackPawnMasks;
    attackers |= bitboards[pawn] & mask[kingSq];

    // Knights
    const knight = side === WHITE ? BLACK_KNIGHT : WHITE_KNIGHT;
    attackers |= knightMasks[kingSq] & bitboards[knight];

    // Sliding Pieces
    const ortho =
      side === WHITE
        ? bitboards[BLACK_QUEEN] | bitboards[BLACK_ROOK]
        : bitboards[WHITE_QUEEN] | bitboards[WHITE_ROOK];
    attackers |= rookAttacks(kingSq, occ) & ortho;

    const sliding =
      side === WHITE
        ? bitboards[BLACK_QUEEN] | bitboards[BLACK_BISHOP]
        : bitboards[WHITE_QUEEN] | bitboards[WHITE_BISHOP];
    attackers |= bishopAttacks(kingSq, occ) & sliding;

    return attackers;
  }

  getPinnedPieces(): bigint {
    const side = this.sideToMove;
    const kingSq = this.kingSq[side];
    const opp = side ^ 1;
    const friendly = this.playerOcc[side];
    let pinned = 0n;

    // Candidate pinners: enemy sliders that share a ray with the king
    const bishop = side === WHITE ? BLACK_BISHOP : WHITE_BISHOP;
    const queen = side === WHITE ? BLACK_QUEEN : WHITE_QUEEN;
    const bishopPinners =
      bishopAttacks(kingSq, this.playerOcc[opp]) &
      (this.bitboards[bishop] | this.bitboards[queen]);

    const rook = side === WHITE ? BLACK_ROOK : WHITE_ROOK;
    const rookPinners =
      rookAttacks(kingSq, this.playerOcc[opp]) &
      (this.bitboards[rook] | this.bitboards[queen]);

    // For each candidate pinner, check if exactly one friendly piece is between
    let pinners = bishopPinners | rookPinners;
    while (pinners) {
      const pinnerSq = bitScanForward(pinners);
      pinners &= pinners - 1n;

      const between = betweenMask[kingSq][pinnerSq] & this.occupied;

      // Exactly one piece between king and pinner, and it's friendly = pinned
      if (between && !moreThanOne(between) && between & friendly) {
        pinned |= between;
      }
    }

    return pinned;
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
