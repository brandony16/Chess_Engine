import {
  CHECKMATE,
  DRAW,
  type EndState,
  type Piece,
  type Player,
  type Result,
  type Square,
} from "./chessConstants.ts";
import type Move from "./moveMaking/move.ts";
import { Position } from "./Position.ts";
import { Snapshot } from "./Snapshot.ts";

type GameResult = {
  winner: Result;
  method: EndState;
};

interface GameView {
  readonly sideToMove: Player;
  playMove(move: Move): boolean;
  undoMove(): boolean;
  fen(): string;
  loadFen(fen: string): void;
  getPiece(square: Square): Piece;
  isPlayersPieceAt(square: Square, player: Player): boolean;
  generateLegalMoves(): Move[];
  isInCheck(player?: Player): boolean;
  isOver(): boolean;
  result(): GameResult;
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

  loadFen(fen: string) {
    this.position.loadFen(fen);
  }

  getPiece(square: Square): Piece {
    return this.position.pieceAt[square];
  }

  isPlayersPieceAt(square: Square, player: Player): boolean {
    const mask = 1n << BigInt(square);
    return (mask & this.position.playerOcc[player]) !== 0n;
  }

  generateLegalMoves(): Move[] {
    return this.position.generateLegalMoves();
  }

  legalMovesFrom(square: Square): Move[] {
    const all = this.position.generateLegalMoves();
    return all.filter((move) => move.from === square);
  }

  isInCheck(player?: Player): boolean {
    return this.position.isInCheck(player);
  }

  isOver(): boolean {
    return this.position.gameOver();
  }

  result(): GameResult {
    return { winner: this.position.result, method: this.position.endState };
  }

  getSnapshot(): Snapshot {
    return new Snapshot(
      this.position.sideToMove,
      this.position.pieceAt.slice(),
    );
  }
}
