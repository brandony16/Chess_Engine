import {
  CHECKMATE,
  DRAW,
  NO_PIECE,
  type Piece,
  type Player,
  type Square,
} from "../game/chessConstants.ts";
import type Move from "../game/moveMaking/move.ts";
import { Position } from "../game/Position.ts";
import { Snapshot } from "./Snapshot.ts";

interface GameView {
  readonly sideToMove: Player;
  playMove(move: Move): boolean;
  undoMove(): boolean;
  fen(): string;
  loadFen(fen: string): void;
  getPiece(square: Square): Piece;
  generateLegalMoves(): Move[];
  isOver(): boolean;
  isCheckmate(): boolean;
  isDraw(): boolean;
  getSnapshot(): Snapshot;
}

export class Game implements GameView {
  private position: Position;

  constructor(fen?: string) {
    this.position = new Position();
    if (fen) {
      this.position.loadFen(fen);
    }
  }

  get sideToMove(): Player {
    return this.position.sideToMove;
  }

  playMove(move: Move): boolean {
    if (this.position.gameOver()) {
      return false;
    }
    const legal = this.position.generateLegalMoves();
    const isLegal = legal.some((m) => m.equals(move));
    if (!isLegal) return false;

    this.position.makeMove(move);
    this.position.checkGameOver();
    return true;
  }

  undoMove(): boolean {
    if (this.position.undoStack.length === 0) {
      return false;
    }

    this.position.unmakeMove();
    return true;
  }

  fen(): string {
    return this.position.getFen();
  }

  pgn(): string {
    if (!this.position.gameOver()) {
      return "";
    }

    return this.position.getPGN();
  }

  loadFen(fen: string) {
    this.position.loadFen(fen);
  }

  getPiece(square: Square): Piece {
    return this.position.pieceAt[square];
  }

  generateLegalMoves(): Move[] {
    return this.position.generateLegalMoves();
  }

  legalMovesFrom(square: Square): Move[] {
    const all = this.position.generateLegalMoves();
    return all.filter((move) => move.from === square);
  }

  isOver(): boolean {
    return this.position.gameOver();
  }

  isCheckmate(): boolean {
    return this.position.endState === CHECKMATE;
  }

  isDraw(): boolean {
    throw this.position.result === DRAW;
  }

  getSnapshot(): Snapshot {
    return new Snapshot(
      this.position.sideToMove,
      this.position.pieceAt.slice(),
    );
  }
}
