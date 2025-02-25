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

    board[0] = ["r", "-", "-", "-", "k", "-", "-", "r"]
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
  })
});

// describe("isSquareUnderAttack", () => {
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

// describe("isInCheck", () => {
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

// describe("isValidMoveWithCheck", () => {
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

// describe("isGameOver", () => {
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
