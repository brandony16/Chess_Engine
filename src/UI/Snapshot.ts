import type { Piece, Player, Square } from "../game/chessConstants.ts";

interface SnapshotView {
  readonly sideToMove: Player;
  getPiece(square: Square): Piece;
}

export class Snapshot implements SnapshotView {
  readonly sideToMove: Player;
  readonly pieceAt: Piece[];

  constructor(sideToMove: Player, pieceAt: Piece[]) {
    this.sideToMove = sideToMove;
    this.pieceAt = pieceAt;
  }

  getPiece(square: Square): Piece {
    return this.pieceAt[square];
  }
}
