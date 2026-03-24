import type { Piece, Player, Square } from "./chessConstants.ts";

interface SnapshotView {
  readonly sideToMove: Player;
  getPiece(square: Square): Piece;
}

export class Snapshot implements SnapshotView {
  readonly sideToMove: Player;
  readonly pieceAt: Int8Array;

  constructor(sideToMove: Player, pieceAt: Int8Array) {
    this.sideToMove = sideToMove;
    this.pieceAt = pieceAt;
  }

  getPiece(square: Square): Piece {
    return this.pieceAt[square] as Piece;
  }
}
