/**
 * Stores values for a move
 */
class Move {
  /**
   * Sets up the move object
   *
   * @param {number} from - the square moving from
   * @param {number} to - the square moving to
   * @param {number} piece - the index of the moving piece
   * @param {number} captured - the index of the captured peice, if there is one
   * @param {number} promotion - the index of the promotion piece, if there is one
   * @param {boolean} castling - if the move is a castle
   * @param {boolean} enPassant - if the move was en passant
   */
  constructor(from, to, piece, captured, promotion, castling, enPassant) {
    this.from = from;
    this.to = to;
    this.piece = piece;
    this.captured = captured;
    this.promotion = promotion;
    this.castling = castling;
    this.enPassant = enPassant;
  }
}

export default Move;
