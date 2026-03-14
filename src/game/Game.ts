import {
  CHECKMATE,
  DRAW,
  type EndState,
  type Piece,
  type Player,
  type Result,
  type Square,
} from "./chessConstants.ts";
import { moveFrom, type Move } from "./moveMaking/move.ts";
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
  generateLegalMoves(): Uint32Array;
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
    const legalCount = this.position.generateLegalMoves();
    let isLegal = false;
    for (let i = 0; i < legalCount; i++) {
      const m = this.position.moveBuffer[i];
      if (move === m) {
        isLegal = true;
        break;
      }
    }

    if (!isLegal) return false;

    this.position.makeMove(move);
    this.position.checkGameOver();
    return true;
  }

  undoMove(): boolean {
    if (this.position.ply === 0) {
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

  generateLegalMoves(): Uint32Array {
    const numLegal = this.position.generateLegalMoves();
    const arr = new Uint32Array(numLegal);
    for (let i = 0; i < numLegal; i++) {
      arr[i] = this.position.moveBuffer[i];
    }

    return arr;
  }

  legalMovesFrom(square: Square): Move[] {
    const moves: Move[] = [];
    const all = this.generateLegalMoves();

    for (const move of all) {
      if (moveFrom(move) === square) {
        moves.push(move);
      }
    }

    return moves;
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

  getPositionCpy(): Position {
    return this.position.copy();
  }
}
