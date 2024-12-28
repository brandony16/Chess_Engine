import { getLegalMoves, getAllPawnMoves, getAllRookMoves, getAllKnightMoves, getAllBishopMoves, getAllQueenMoves, getKingMoves } from '../utils/pieceMoves';
import { initializeBoard } from '../utils/chessLogic'

describe("Chess Move Functions", () => {
  const emptyBoard = Array(8)
    .fill(null)
    .map(() => Array(8).fill("-"));

  it("should generate correct moves for a pawn", () => {
    const board = JSON.parse(JSON.stringify(emptyBoard));
    board[6][3] = "P"; // Place a white pawn at d2

    const gameState = { enPassant: null };
    const moves = getAllPawnMoves(board, "w", gameState);

    expect(moves).toEqual([
      [
        [6, 3],
        [5, 3],
      ],
      [
        [6, 3],
        [4, 3],
      ],
    ]);
  });

  it("should generate correct moves for a rook", () => {
    const board = JSON.parse(JSON.stringify(emptyBoard));
    board[0][0] = "R"; // Place a white rook at a1

    const moves = getAllRookMoves(board, "w");
    expect(moves.length).toBe(14); // 7 horizontal, 7 vertical
  });

  it("should generate correct moves for a knight", () => {
    const board = JSON.parse(JSON.stringify(emptyBoard));
    board[4][4] = "N"; // Place a white knight at e5

    const moves = getAllKnightMoves(board, "w");
    expect(moves).toEqual(
      expect.arrayContaining([
        [
          [4, 4],
          [6, 5],
        ],
        [
          [4, 4],
          [6, 3],
        ],
        [
          [4, 4],
          [5, 6],
        ],
        [
          [4, 4],
          [5, 2],
        ],
        [
          [4, 4],
          [3, 6],
        ],
        [
          [4, 4],
          [3, 2],
        ],
        [
          [4, 4],
          [2, 5],
        ],
        [
          [4, 4],
          [2, 3],
        ],
      ])
    );
  });

  it("should generate correct moves for a bishop", () => {
    const board = JSON.parse(JSON.stringify(emptyBoard));
    board[3][3] = "B"; // Place a white bishop at d4

    const moves = getAllBishopMoves(board, "w");
    expect(moves.length).toBe(13); // Diagonals
  });

  it("should generate correct moves for a queen", () => {
    const board = JSON.parse(JSON.stringify(emptyBoard));
    board[4][4] = "Q"; // Place a white queen at e5

    const moves = getAllQueenMoves(board, "w");
    expect(moves.length).toBe(27); // 8 horizontal, 8 vertical, 13 diagonal
  });

  it("should generate correct moves for a king", () => {
    const board = JSON.parse(JSON.stringify(emptyBoard));
    board[4][4] = "K"; // Place a white king at e5

    const gameState = {
      kingMoved: { w: true },
      rookMoved: {
        w: {
          kingside: true,
          queenside: true,
        },
      },
    };
    const moves = getKingMoves(board, 4, 4, "w", gameState);

    expect(moves.length).toBe(8); // One square in all directions
  });

  it("should generate all legal moves for all pieces", () => {
    const board = initializeBoard()

    const gameState = {
      enPassant: null,
      kingMoved: { w: false, b: false },
      rookMoved: {
        w: {
          kingside: false,
          queenside: false,
        },
        b: {
          kingside: false,
          queenside: false,
        },
      },
      kingPosition: { w: [7, 4], b: [0, 4] },
      gameOver: false,
      gameEndState: "none",
    };

    const moves = getLegalMoves(board, "w", gameState);

    expect(moves.length).toBe(20); // Ensure moves are generated
  });
});
