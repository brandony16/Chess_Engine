import {
  CHECKMATE,
  DRAW,
  NO_PIECE,
  WHITE,
  type Piece,
  type Square,
} from "../game/chessConstants.ts";
import type Move from "../game/moveMaking/move.ts";
import { Position } from "../game/Position.ts";

interface GameView {
  readonly sideToMove: "w" | "b";
  playMove(move: Move): boolean;
  undoMove(): boolean;
  fen(): string;
  loadFen(fen: string): void;
  getPiece(square: Square): Piece | null;
  generateLegalMoves(): Move[];
  isOver(): boolean;
  isCheckmate(): boolean;
  isDraw(): boolean;
}

export class Game implements GameView {
  private position: Position;

  constructor(fen?: string) {
    this.position = new Position();
    if (fen) {
      this.position.loadFen(fen);
    }
  }

  get sideToMove(): "w" | "b" {
    return this.position.sideToMove === WHITE ? "w" : "b";
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

  loadFen(fen: string) {
    this.position.loadFen(fen);
  }

  getPiece(square: Square): Piece | null {
    const piece = this.position.pieceAt[square];
    return piece === NO_PIECE ? null : piece;
  }

  generateLegalMoves(): Move[] {
    return this.position.generateLegalMoves();
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
}
