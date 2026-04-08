import { moreThanOne } from "./bb.ts";
import {
  NO_PIECE,
  WHITE,
  type EndState,
  type Piece,
  type Player,
  type Result,
  type Square,
} from "./chessConstants.ts";
import { moveFrom, type Move } from "./moveMaking/move.ts";
import { isWhite } from "./pieceUtils/pieceClassifiers.ts";
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
  generateLegalMoves(): number[];
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

    const legal = this.generateLegalMoves();
    const found = legal.find((m) => m === move);

    if (!found) return false;

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
    return this.position.pieceAt[square] as Piece;
  }

  isPlayersPieceAt(square: Square, player: Player): boolean {
    const piece = this.position.pieceAt[square] as Piece;
    if (piece === NO_PIECE) return false;

    return player === WHITE ? isWhite(piece) : !isWhite(piece);
  }

  generateLegalMoves(): number[] {
    this.position.searchPly = 0;
    const num = this.position.generatePseudoLegalMoves();
    const checkers = this.position.getCheckers();
    const pinned = this.position.getPinnedPieces();
    const inDoubleCheck = moreThanOne(checkers[0], checkers[1]);

    const arr: number[] = [];
    for (let i = 0; i < num; i++) {
      const move = this.position.moveBuffer[i];
      if (this.position.isLegal(move, checkers, pinned, inDoubleCheck)) {
        arr.push(move);
      }
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
