import { type CastlingNumber, type Piece, type Square } from "../chessConstants.ts";

/**
 * Stores values for a move
 */
class Move {
  from: Square;
  to: Square;
  piece: Piece;
  captured: Piece | -1;
  promotion: Piece | -1;
  castling: boolean;
  enPassant: boolean;

  /**
   * Sets up the move object
   */
  constructor(
    from: Square,
    to: Square,
    piece: Piece,
    captured: Piece | -1 = -1,
    promotion: Piece | -1 = -1,
    castling: boolean = false,
    enPassant: boolean = false,
  ) {
    this.from = from;
    this.to = to;
    this.piece = piece;
    this.captured = captured;
    this.promotion = promotion;
    this.castling = castling;
    this.enPassant = enPassant;
  }

  equals(other: Move): boolean {
    return (
      this.from === other.from &&
      this.to === other.to &&
      this.piece === other.piece &&
      this.captured === other.captured &&
      this.promotion === other.promotion &&
      this.castling === other.castling &&
      this.enPassant === other.enPassant
    );
  }

  /**
   * Copies the current move and changes any fields to what fields are given.
   * Helpful for promotion moves when you need 4 different moves each with
   * different promotion fields
   */
  copyWith(params: Partial<Move>): Move {
    return new Move(
      params.from ?? this.from,
      params.to ?? this.to,
      params.piece ?? this.piece,
      params.captured ?? this.captured,
      params.promotion ?? this.promotion,
      params.castling ?? this.castling,
      params.enPassant ?? this.enPassant,
    );
  }
}

export interface Undo {
  captured: Piece;
  castlingRights: CastlingNumber;
  epSquare: Square;
  halfmoveClock: number;
  zobristKey: bigint;
}

export default Move;
