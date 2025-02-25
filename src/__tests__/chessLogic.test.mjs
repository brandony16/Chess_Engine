import {
  initializeBoard,
  isValidMove,
  pathIsClear,
  diagIsClear,
  isCastlingLegal,
  isSquareUnderAttack,
  isInCheck,
  isValidMoveWithCheck,
  isGameOver,
  threefoldRep,
  boardsEqual,
} from "../utils/chessLogic";

describe("initializeBoard", () => {
  it("should return the correct initial chess board setup", () => {
    const expectedBoard = [
      ["r", "n", "b", "q", "k", "b", "n", "r"],
      ["p", "p", "p", "p", "p", "p", "p", "p"],
      ["-", "-", "-", "-", "-", "-", "-", "-"],
      ["-", "-", "-", "-", "-", "-", "-", "-"],
      ["-", "-", "-", "-", "-", "-", "-", "-"],
      ["-", "-", "-", "-", "-", "-", "-", "-"],
      ["P", "P", "P", "P", "P", "P", "P", "P"],
      ["R", "N", "B", "Q", "K", "B", "N", "R"],
    ];
    expect(initializeBoard()).toEqual(expectedBoard);
  });
});

describe("isValidMove", () => {
  let board;
  let gameState;

  beforeEach(() => {
    board = initializeBoard();
    gameState = {
      enPassant: null,
      kingMoved: { w: false, b: false },
      rookMoved: { w: {}, b: {} },
      kingPosition: { w: [7, 4], b: [0, 4] },
    };
  });

  it("should allow a white pawn to move forward one square", () => {
    expect(isValidMove(board, 6, 4, 5, 4, "w", gameState)).toBe(true);
  });

  it("should allow a black pawn to move forward one square", () => {
    expect(isValidMove(board, 1, 4, 2, 4, "b", gameState)).toBe(true);
  });

  it("should allow a white pawn to move forward two squares from its starting position", () => {
    expect(isValidMove(board, 6, 4, 4, 4, "w", gameState)).toBe(true);
  });

  it("should prevent a pawn from moving backward", () => {
    expect(isValidMove(board, 6, 4, 7, 4, "w", gameState)).toBe(false);
  });

  it("should prevent a white pawn from capturing forward", () => {
    expect(isValidMove(board, 6, 4, 5, 4, "w", gameState)).toBe(true);
    expect(isValidMove(board, 6, 4, 5, 3, "w", gameState)).toBe(false);
  });

  it("should allow a knight to move in an L shape", () => {
    expect(isValidMove(board, 7, 1, 5, 2, "w", gameState)).toBe(true);
  });

  it("should prevent a rook from moving diagonally", () => {
    expect(isValidMove(board, 7, 0, 6, 1, "w", gameState)).toBe(false);
  });
});

describe("pathIsClear", () => {
  let board;

  beforeEach(() => {
    board = initializeBoard();
  });

  it("should prevent movement through a piece horizontally", () => {
    expect(pathIsClear(board, 0, 0, 0, 4)).toBe(false);
  });

  it("should allow movement horizontally when path is clear", () => {
    board[0][1] = "-";
    board[0][2] = "-";

    expect(pathIsClear(board, 0, 0, 0, 3)).toBe(true);
  });

  it("should prevent movement through a piece vertically", () => {
    expect(pathIsClear(board, 0, 0, 4, 0)).toBe(false);
  });

  it("should allow movement vertically when path is clear", () => {
    board[1][0] = "-";

    expect(pathIsClear(board, 0, 0, 4, 0)).toBe(true);
  });
});

describe("diagIsClear", () => {
  let board;

  beforeEach(() => {
    board = initializeBoard();
  });

  it("should be false if the squares are not on a diagonal", () => {
    expect(diagIsClear(board, 0, 0, 4, 0)).toBe(false);
  });

  it("should return false if there is a piece on the diagonal", () => {
    expect(diagIsClear(board, 0, 0, 7, 7)).toBe(false);
  });

  it("should return true if there are no pieces on the diagonal", () => {
    expect(diagIsClear(board, 2, 2, 5, 5)).toBe(true);
  });
});

describe("isCastlingLegal", () => {
  let board;
  let gameState;

  beforeEach(() => {
    board = initializeBoard();

    board[0] = ["r", "-", "-", "-", "k", "-", "-", "r"];
    board[7] = ["R", "-", "-", "-", "K", "-", "-", "R"];

    gameState = {
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
    };
  });

  it("should return false if the king has moved", () => {
    gameState.kingMoved.w = true;
    expect(isCastlingLegal(board, "w", gameState, "kingside")).toBe(false);

    gameState.kingMoved.b = true;
    expect(isCastlingLegal(board, "b", gameState, "kingside")).toBe(false);
  });

  it("should return false if the corresponding rook has moved", () => {
    gameState.rookMoved.w.kingside = true;
    expect(isCastlingLegal(board, "w", gameState, "kingside")).toBe(false);

    gameState.rookMoved.b.queenside = true;
    expect(isCastlingLegal(board, "b", gameState, "queenside")).toBe(false);
  });

  it("should return false if there is a piece in the way of the castling", () => {
    board[7][1] = "N";
    expect(isCastlingLegal(board, "w", gameState, "queenside")).toBe(false);

    board[7][5] = "B";
    expect(isCastlingLegal(board, "w", gameState, "kingside")).toBe(false);
  });

  it("should return false if the castling squares are being attacked by an enemy piece", () => {
    board[1][1] = "Q";
    expect(isCastlingLegal(board, "b", gameState, "queenside")).toBe(false);

    board[2][6] = "N";
    expect(isCastlingLegal(board, "b", gameState, "kingside")).toBe(false);
  });

  it("should return true if castling is legal", () => {
    expect(isCastlingLegal(board, "w", gameState, "kingside")).toBe(true);
    expect(isCastlingLegal(board, "b", gameState, "kingside")).toBe(true);
    expect(isCastlingLegal(board, "w", gameState, "queenside")).toBe(true);
    expect(isCastlingLegal(board, "b", gameState, "queenside")).toBe(true);
  });
});

describe("isSquareUnderAttack", () => {
  let board;

  beforeEach(() => {
    board = initializeBoard();
  });

  it("should return false if the square is not under attack", () => {
    expect(isSquareUnderAttack(board, 0, 1, "b")).toBe(false);
    expect(isSquareUnderAttack(board, 7, 1, "w")).toBe(false);
  });

  it("should return true if the square is under attack", () => {
    board[1][1] = "Q";
    expect(isSquareUnderAttack(board, 0, 1, "b")).toBe(true);

    board[6][1] = "r";
    expect(isSquareUnderAttack(board, 7, 1, "w")).toBe(true);
  });
});

describe("isInCheck", () => {
  let board;
  let gameState;

  beforeEach(() => {
    board = initializeBoard();
    gameState = {
      kingMoved: { w: false, b: false },
      rookMoved: { w: {}, b: {} },
      kingPosition: { w: [7, 4], b: [0, 4] },
    };
  });

  it("should identify when the king is not in check", () => {
    expect(isInCheck(board, [7, 4], "w", gameState)).toBe(false);
    expect(isInCheck(board, [0, 4], "b", gameState)).toBe(false);

    board[1] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    board[6] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    board[3][4] = "q";
    board[6][4] = "P";
    board[4][7] = "b";
    board[6][5] = "P";

    expect(isInCheck(board, [7, 4], "w", gameState)).toBe(false);

    board[3][4] = "Q";
    board[1][4] = "p";
    board[4][0] = "B";
    board[1][3] = "p";
    expect(isInCheck(board, [0, 4], "b", gameState)).toBe(false);
  });

  it("should identify when the king is in check", () => {
    board[1] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    board[6] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    board[3][4] = "q";

    expect(isInCheck(board, [7, 4], "w", gameState)).toBe(true);

    board[6][4] = "P";
    board[4][7] = "b";

    expect(isInCheck(board, [7, 4], "w", gameState)).toBe(true);

    board[3][4] = "Q";
    expect(isInCheck(board, [0, 4], "b", gameState)).toBe(true);

    board[1][4] = "p";
    board[4][0] = "B";
    expect(isInCheck(board, [0, 4], "b", gameState)).toBe(true);
  });
});

describe("isValidMoveWithCheck", () => {
  let board;
  let gameState;

  beforeEach(() => {
    board = initializeBoard();
    gameState = {
      enPassant: null,
      kingMoved: { w: false, b: false },
      rookMoved: { w: {}, b: {} },
      kingPosition: { w: [7, 4], b: [0, 4] },
    };
  });

  it("should not allow movement to a piece of the same color", () => {
    expect(isValidMoveWithCheck(board, 0, 0, 1, 0, "b", gameState)).toBe(false);
    expect(isValidMoveWithCheck(board, 7, 0, 6, 0, "w", gameState)).toBe(false);
  });

  it("should not allow a move that puts or keeps its king in check", () => {
    board[1][4] = "-";
    board[6][4] = "-";

    board[4][4] = "Q"; // Puts black king in check
    expect(isValidMoveWithCheck(board, 0, 3, 3, 6, "b", gameState)).toBe(false);

    board[1][4] = "q"; // Blocks whites check
    expect(isValidMoveWithCheck(board, 1, 4, 3, 6, "b", gameState)).toBe(false);

    // Check from black is blocked by white queen
    expect(isValidMoveWithCheck(board, 4, 4, 4, 7, "w", gameState)).toBe(false);
    board[4][4] = "-"; // Puts white king in check
    expect(isValidMoveWithCheck(board, 7, 3, 5, 5, "w", gameState)).toBe(false);
  });

  it("should allow movement that blocks checks", () => {
    board[1][4] = "-";
    board[6][4] = "-";
    board[4][4] = "Q"; // Puts black king in check

    expect(isValidMoveWithCheck(board, 0, 5, 1, 4, "b", gameState)).toBe(true);
    expect(isValidMoveWithCheck(board, 0, 3, 1, 4, "b", gameState)).toBe(true);

    board[4][4] = "q"; // Puts white king in check
    expect(isValidMoveWithCheck(board, 7, 3, 6, 4, "w", gameState)).toBe(true);
    expect(isValidMoveWithCheck(board, 7, 5, 6, 4, "w", gameState)).toBe(true);
  });

  it("should allow normal movement", () => {
    expect(isValidMoveWithCheck(board, 6, 4, 4, 4, "w", gameState)).toBe(true);
    expect(isValidMoveWithCheck(board, 1, 4, 3, 4, "b", gameState)).toBe(true);
    expect(isValidMoveWithCheck(board, 7, 1, 5, 2, "w", gameState)).toBe(true);
    expect(isValidMoveWithCheck(board, 0, 6, 2, 5, "b", gameState)).toBe(true);
  });
});

describe("isGameOver", () => {
  let board;
  let gameState;
  let boards;

  beforeEach(() => {
    board = initializeBoard();
    for (let i = 0; i < board.length; i++) {
      board[i] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    }
    board[7][4] = 'K';
    board[0][4] = 'k';

    gameState = {
      enPassant: null,
      kingMoved: { w: false, b: false },
      rookMoved: { w: {}, b: {} },
      kingPosition: { w: [7, 4], b: [0, 4] },
    };

    boards = [initializeBoard()];
  });

  it("should identify a threefold repetition", () => {
    boards = [initializeBoard(), initializeBoard(), initializeBoard()];
    expect(isGameOver(board, "w", gameState, boards)).toBe(
      "Draw by repetition"
    );
  });

  it("should identify a stalemate", () => {
    board[1][2] = 'Q';
    board[1][6] = 'Q';
    expect(isGameOver(board, 'w', gameState, boards)).toBe("stalemate");

    board[0][0] = 'R';
    board[0][3] = 'n';
    expect(isGameOver(board, 'w', gameState, boards)).toBe("stalemate");
  });

  it("should identify checkmate", () => {
    board[7][0] = 'r';
    board[6][0] = 'r';
    expect(isGameOver(board, 'b', gameState, boards)).toBe("checkmate");

    board[7][3] = 'N';
    board[6][5] = 'q';
    expect(isGameOver(board, 'b', gameState, boards)).toBe("checkmate");
  });
});

// describe("threefoldRep", () => {
//   let board;
//   let gameState;

//   beforeEach(() => {
//     board = initializeBoard();
//     gameState = {
//       enPassant: null,
//       kingMoved: { w: false, b: false },
//       rookMoved: { w: {}, b: {} },
//       kingPosition: { w: [7, 4], b: [0, 4] },
//     };
//   });
// });

// describe("boardsEqual", () => {
//   let board;
//   let gameState;

//   beforeEach(() => {
//     board = initializeBoard();
//     gameState = {
//       enPassant: null,
//       kingMoved: { w: false, b: false },
//       rookMoved: { w: {}, b: {} },
//       kingPosition: { w: [7, 4], b: [0, 4] },
//     };
//   });
// });
