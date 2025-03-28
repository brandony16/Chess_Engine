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
  updateGameState,
  insufficientMaterial,
  simulateMove,
  sortMoves,
  canPieceAttackSquare,
  doesMovePutInCheck,
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

describe("isValidMovePawns", () => {
  let board;
  let gameState;

  beforeEach(() => {
    board = initializeBoard();
    gameState = {};
  });

  it("should not allow movement to a piece of the same color", () => {
    expect(isValidMove(board, 0, 0, 1, 0, gameState)).toBe(false);
    expect(isValidMove(board, 7, 2, 6, 1, gameState)).toBe(false);
  });

  it("should allow a pawn to move forward one square", () => {
    expect(isValidMove(board, 6, 4, 5, 4, gameState)).toBe(true);
    expect(isValidMove(board, 1, 4, 2, 4, gameState)).toBe(true);
  });

  it("should allow a pawn to move forward two squares", () => {
    expect(isValidMove(board, 6, 4, 4, 4, gameState)).toBe(true);
    expect(isValidMove(board, 1, 4, 3, 4, gameState)).toBe(true);
  });

  it("should prevent a pawn from moving backward", () => {
    board[0][0] = "-";
    board[7][0] = "-";
    expect(isValidMove(board, 6, 0, 7, 0, gameState)).toBe(false);
    expect(isValidMove(board, 1, 0, 0, 0, gameState)).toBe(false);
  });

  it("should prevent a pawn from capturing a piece in front of it", () => {
    board[4][4] = "P";
    board[3][4] = "p";
    expect(isValidMove(board, 4, 4, 3, 4, gameState)).toBe(false);
    expect(isValidMove(board, 3, 4, 4, 4, gameState)).toBe(false);
  });

  it("should only allow diagonal movement when capturing", () => {
    expect(isValidMove(board, 1, 0, 2, 1, gameState)).toBe(false);
    expect(isValidMove(board, 6, 0, 5, 1, gameState)).toBe(false);

    board[2][1] = "P";
    board[5][1] = "p";

    expect(isValidMove(board, 1, 0, 2, 1, gameState)).toBe(true);
    expect(isValidMove(board, 6, 0, 5, 1, gameState)).toBe(true);
  });

  it("should allow enpassant capture when it is valid", () => {
    board[3][1] = "P";
    board[3][0] = "p";

    gameState.enPassant = 16;
    expect(isValidMove(board, 3, 1, 2, 0, gameState)).toBe(true);
    expect(isValidMove(board, 3, 0, 4, 1, gameState)).toBe(false);

    gameState.enPassant = 33;
    expect(isValidMove(board, 3, 1, 2, 0, gameState)).toBe(false);
    expect(isValidMove(board, 3, 0, 4, 1, gameState)).toBe(true);

    gameState.enPassant = null;
    expect(isValidMove(board, 3, 1, 2, 0, gameState)).toBe(false);
    expect(isValidMove(board, 3, 0, 4, 1, gameState)).toBe(false);
  });
});

describe("isValidMoveRook", () => {
  let board;
  let gameState;

  beforeEach(() => {
    board = initializeBoard();
    gameState = {};
  });

  it("should not allow the rook to move off the board", () => {
    expect(isValidMove(board, 0, 0, -1, 0, gameState)).toBe(false);
    expect(isValidMove(board, 7, 0, 8, 0, gameState)).toBe(false);
  });

  it("should not allow the rook to move through pieces", () => {
    expect(isValidMove(board, 0, 0, 4, 0, gameState)).toBe(false);
    expect(isValidMove(board, 7, 0, 4, 0, gameState)).toBe(false);
  });

  it("should not allow the rook to move diagonally", () => {
    board[1] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    board[6] = ["-", "-", "-", "-", "-", "-", "-", "-"];

    expect(isValidMove(board, 0, 0, 4, 4, gameState)).toBe(false);
    expect(isValidMove(board, 7, 0, 5, 2, gameState)).toBe(false);
  });

  it("should allow the rook to move horizontally and vertically", () => {
    board[1] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    board[6] = ["-", "-", "-", "-", "-", "-", "-", "-"];

    expect(isValidMove(board, 0, 0, 4, 0, gameState)).toBe(true);
    expect(isValidMove(board, 0, 0, 7, 0, gameState)).toBe(true);
    expect(isValidMove(board, 7, 0, 4, 0, gameState)).toBe(true);
    expect(isValidMove(board, 7, 0, 0, 0, gameState)).toBe(true);

    board[4][4] = "R";
    board[4][0] = "r";

    expect(isValidMove(board, 4, 4, 4, 7, gameState)).toBe(true);
    expect(isValidMove(board, 4, 4, 4, 0, gameState)).toBe(true);
    expect(isValidMove(board, 4, 0, 4, 2, gameState)).toBe(true);
    expect(isValidMove(board, 4, 0, 4, 4, gameState)).toBe(true);
  });
});

describe("isValidMoveBishop", () => {
  let board;
  let gameState;

  beforeEach(() => {
    board = initializeBoard();
    gameState = {};
  });

  it("should not allow movement not on a diagonal", () => {
    board[1] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    board[6] = ["-", "-", "-", "-", "-", "-", "-", "-"];

    expect(isValidMove(board, 0, 2, 4, 2, gameState)).toBe(false);
    expect(isValidMove(board, 7, 2, 4, 2, gameState)).toBe(false);
  });

  it("should not allow movement through pieces", () => {
    expect(isValidMove(board, 0, 2, 3, 0, gameState)).toBe(false);
    expect(isValidMove(board, 7, 2, 5, 0, gameState)).toBe(false);

    board[1] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    board[6] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    board[2][4] = "B";
    board[4][2] = "b";
    expect(isValidMove(board, 2, 4, 5, 1, gameState)).toBe(false);
    expect(isValidMove(board, 4, 2, 1, 5, gameState)).toBe(false);
  });

  it("should allow moves that are valid", () => {
    board[1] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    board[6] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    expect(isValidMove(board, 0, 2, 3, 5, gameState)).toBe(true);
    expect(isValidMove(board, 7, 2, 5, 0, gameState)).toBe(true);

    board[2][0] = "P";
    board[5][0] = "p";
    expect(isValidMove(board, 0, 2, 2, 0, gameState)).toBe(true);
    expect(isValidMove(board, 7, 2, 5, 0, gameState)).toBe(true);
  });
});

describe("isValidMoveKnight", () => {
  let board;
  let gameState;

  beforeEach(() => {
    board = initializeBoard();
    gameState = {};
  });

  it("should not allow non L shaped moves", () => {
    expect(isValidMove(board, 7, 1, 3, 1, gameState)).toBe(false);
    expect(isValidMove(board, 7, 1, 5, 3, gameState)).toBe(false);
    expect(isValidMove(board, 0, 1, 2, 1, gameState)).toBe(false);
    expect(isValidMove(board, 0, 1, 2, 3, gameState)).toBe(false);
  });

  it("should allow legal knight moves", () => {
    expect(isValidMove(board, 7, 1, 5, 2, gameState)).toBe(true);
    expect(isValidMove(board, 7, 1, 5, 0, gameState)).toBe(true);
    expect(isValidMove(board, 0, 1, 2, 2, gameState)).toBe(true);
    expect(isValidMove(board, 0, 1, 2, 0, gameState)).toBe(true);

    board[4][2] = "N";
    board[3][4] = "n";

    expect(isValidMove(board, 4, 2, 3, 4, gameState)).toBe(true);
    expect(isValidMove(board, 3, 4, 4, 2, gameState)).toBe(true);
  });
});

describe("isValidMoveQueen", () => {
  let board;
  let gameState;

  beforeEach(() => {
    board = initializeBoard();
    gameState = {};
  });

  it("should not allow movement not on a diagonal or on a line", () => {
    board[1] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    board[6] = ["-", "-", "-", "-", "-", "-", "-", "-"];

    expect(isValidMove(board, 7, 3, 5, 2, gameState)).toBe(false);
    expect(isValidMove(board, 0, 3, 2, 2, gameState)).toBe(false);
  });

  it("should not allow movement through pieces", () => {
    expect(isValidMove(board, 7, 3, 5, 3, gameState)).toBe(false);
    expect(isValidMove(board, 7, 3, 5, 1, gameState)).toBe(false);
    expect(isValidMove(board, 0, 3, 5, 3, gameState)).toBe(false);
    expect(isValidMove(board, 0, 3, 2, 1, gameState)).toBe(false);
  });

  it("should allow legal queen moves", () => {
    board[1] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    board[6] = ["-", "-", "-", "-", "-", "-", "-", "-"];

    expect(isValidMove(board, 7, 3, 4, 3, gameState)).toBe(true);
    expect(isValidMove(board, 7, 3, 4, 6, gameState)).toBe(true);
    expect(isValidMove(board, 0, 3, 4, 3, gameState)).toBe(true);
    expect(isValidMove(board, 0, 3, 3, 0, gameState)).toBe(true);

    expect(isValidMove(board, 0, 3, 7, 3, gameState)).toBe(true);
    expect(isValidMove(board, 7, 3, 0, 3, gameState)).toBe(true);
  });
});

describe("isValidMoveKing", () => {
  let board;
  let gameState;

  beforeEach(() => {
    board = initializeBoard();

    board[0] = ["r", "-", "-", "-", "k", "-", "-", "r"];
    board[1] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    board[6] = ["-", "-", "-", "-", "-", "-", "-", "-"];
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

  it("should not allow the king to move more than one square", () => {
    expect(isValidMove(board, 0, 4, 2, 4, gameState)).toBe(false);
    expect(isValidMove(board, 7, 4, 5, 4, gameState)).toBe(false);
    expect(isValidMove(board, 0, 4, 2, 2, gameState)).toBe(false);
    expect(isValidMove(board, 7, 4, 5, 2, gameState)).toBe(false);
  });

  it("should allow the king to move one square", () => {
    expect(isValidMove(board, 0, 4, 0, 3, gameState)).toBe(true);
    expect(isValidMove(board, 0, 4, 1, 3, gameState)).toBe(true);
    expect(isValidMove(board, 0, 4, 1, 4, gameState)).toBe(true);
    expect(isValidMove(board, 7, 4, 7, 3, gameState)).toBe(true);
    expect(isValidMove(board, 7, 4, 6, 3, gameState)).toBe(true);
    expect(isValidMove(board, 7, 4, 6, 4, gameState)).toBe(true);
  });

  it("should not allow castling if the king has moved", () => {
    gameState.kingMoved.w = true;
    expect(isValidMove(board, 7, 4, 7, 6, gameState)).toBe(false);
    expect(isValidMove(board, 7, 4, 7, 2, gameState)).toBe(false);

    gameState.kingMoved.b = true;
    expect(isValidMove(board, 0, 4, 0, 6, gameState)).toBe(false);
    expect(isValidMove(board, 0, 4, 0, 2, gameState)).toBe(false);
  });

  it("should allow castling if it is legal", () => {
    expect(isValidMove(board, 7, 4, 7, 6, gameState)).toBe(true);
    expect(isValidMove(board, 7, 4, 7, 2, gameState)).toBe(true);

    expect(isValidMove(board, 0, 4, 0, 2, gameState)).toBe(true);
    expect(isValidMove(board, 0, 4, 0, 6, gameState)).toBe(true);
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
    expect(isInCheck(board, "w", gameState)).toBe(false);
    expect(isInCheck(board, "b", gameState)).toBe(false);

    board[1] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    board[6] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    board[3][4] = "q";
    board[6][4] = "P";
    board[4][7] = "b";
    board[6][5] = "P";

    expect(isInCheck(board, "w", gameState)).toBe(false);

    board[3][4] = "Q";
    board[1][4] = "p";
    board[4][0] = "B";
    board[1][3] = "p";
    expect(isInCheck(board, "b", gameState)).toBe(false);
  });

  it("should identify when the king is in check", () => {
    board[1] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    board[6] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    board[3][4] = "q";

    expect(isInCheck(board, "w", gameState)).toBe(true);

    board[6][4] = "P";
    board[4][7] = "b";

    expect(isInCheck(board, "w", gameState)).toBe(true);

    board[3][4] = "Q";
    expect(isInCheck(board, "b", gameState)).toBe(true);

    board[1][4] = "p";
    board[4][0] = "B";
    expect(isInCheck(board, "b", gameState)).toBe(true);
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
    board[7][4] = "K";
    board[0][4] = "k";

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
    board[1][2] = "Q";
    board[1][6] = "Q";
    expect(isGameOver(board, "w", gameState, boards)).toBe("stalemate");

    board[0][0] = "R";
    board[0][3] = "n";
    expect(isGameOver(board, "w", gameState, boards)).toBe("stalemate");
  });

  it("should identify checkmate", () => {
    board[7][0] = "r";
    board[6][0] = "r";
    expect(isGameOver(board, "b", gameState, boards)).toBe("checkmate");

    board[7][3] = "N";
    board[6][5] = "q";
    expect(isGameOver(board, "b", gameState, boards)).toBe("checkmate");
  });
});

describe("threefoldRep", () => {
  let boards;

  beforeEach(() => {
    boards = [initializeBoard()];
  });

  it("should return false when there is no threefold repetition", () => {
    let newBoard = initializeBoard();
    newBoard[0][0] = "-";
    boards.push(newBoard);

    newBoard[1][0] = "-";
    boards.push(newBoard);

    expect(threefoldRep(boards)).toBe(false);
  });

  it("should return true when there is a threefold repetition", () => {
    let newBoard = initializeBoard();
    newBoard[1][0] = "-";

    boards.push(newBoard);
    boards.push(initializeBoard());
    boards.push(newBoard);
    boards.push(initializeBoard());

    expect(threefoldRep(boards)).toBe(true);
  });
});

describe("updateGameState", () => {
  let board;
  let gameState;
  let boards;

  beforeEach(() => {
    board = initializeBoard();

    gameState = {
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
      fiftyMoveCounter: 0,
      gameOver: false,
      gameEndState: "none",
    };

    boards = [initializeBoard()];
  });

  it("should do nothing if there is no state to update", () => {
    board[1][0] = "-";
    board[2][0] = "p";
    expect(updateGameState(board, 1, 0, 2, 0, "b", gameState, boards)).toEqual(
      gameState
    );
  });

  it("should update the enpassant if a pawn moves two squares", () => {
    board[3][0] = board[1][0];
    board[1][0] = "-";
    let state = updateGameState(board, 1, 0, 3, 0, "b", gameState, boards);
    boards = [...boards, board.map((row) => [...row])];

    expect(state.enPassant).toBe(16);

    board[5][2] = board[7][1];
    board[7][1] = "-";
    state = updateGameState(board, 7, 1, 5, 2, "w", state, boards);

    expect(state.enPassant).toBe(null);
  });

  it("should update king position when the king moves", () => {
    board[7][3] = "K";
    board[7][4] = "-";
    let state = updateGameState(board, 7, 4, 7, 3, "w", gameState, boards);
    boards = [...boards, board.map((row) => [...row])];

    expect(state.kingPosition.w).toEqual([7, 3]);

    board[0][3] = "k";
    board[0][4] = "-";
    state = updateGameState(board, 0, 4, 0, 3, "b", state, boards);

    expect(state.kingPosition.b).toEqual([0, 3]);
  });

  it("should update the state correctly when castling", () => {
    board[7][5] = "R";
    board[7][6] = "K";
    board[7][4] = "-";
    board[7][7] = "-";
    let state = updateGameState(board, 7, 4, 7, 6, "w", gameState, boards);
    boards = [...boards, board.map((row) => [...row])];

    expect(state.kingPosition.w).toEqual([7, 6]);
    expect(state.kingMoved.w).toBe(true);
    expect(state.rookMoved.w.kingside).toBe(true);
    expect(state.rookMoved.w.queenside).toBe(false);

    board[0][3] = "r";
    board[0][2] = "k";
    board[0][1] = "-";
    board[0][0] = "-";
    board[0][4] = "-";
    state = updateGameState(board, 0, 4, 0, 2, "b", state, boards);

    expect(state.kingPosition.b).toEqual([0, 2]);
    expect(state.kingMoved.b).toBe(true);
    expect(state.rookMoved.b.queenside).toBe(true);
    expect(state.rookMoved.b.kingside).toBe(false);
  });

  it("should update the state when a rook moves", () => {
    board[6][0] = "-";
    board[4][0] = "R";
    board[7][0] = "-";
    let state = updateGameState(board, 7, 0, 4, 0, "w", gameState, boards);
    boards = [...boards, board.map((row) => [...row])];

    expect(state.rookMoved.w.queenside).toBe(true);
    expect(state.rookMoved.w.kingside).toBe(false);

    board[1][7] = "-";
    board[0][7] = "-";
    board[3][7] = "r";
    state = updateGameState(board, 0, 7, 3, 7, "b", state, boards);

    expect(state.rookMoved.b.kingside).toBe(true);
    expect(state.rookMoved.b.queenside).toBe(false);
  });

  it("should increment the 50 move counter and reset it", () => {
    board[7][1] = "-";
    board[5][2] = "K";
    let state = updateGameState(board, 7, 1, 5, 2, "w", gameState, boards);
    expect(state.fiftyMoveCounter).toEqual(1);

    board[1][4] = "-";
    board[3][4] = "p";
    state = updateGameState(board, 1, 4, 3, 4, "b", gameState, boards);
    expect(state.fiftyMoveCounter).toEqual(0);
  });

  it("should update when the game is over by mate", () => {
    for (let i = 0; i < board.length; i++) {
      board[i] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    }
    board[7][4] = "K";
    board[0][4] = "k";

    board[6][4] = "q";
    board[1][4] = "r";

    let state = updateGameState(board, 6, 0, 6, 4, "b", gameState, boards);

    expect(state.gameOver).toBe(true);
    expect(state.gameEndState).toBe("checkmate");
  });

  it("should update when the game is over by stalemate", () => {
    for (let i = 0; i < board.length; i++) {
      board[i] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    }
    board[7][4] = "K";
    board[0][4] = "k";

    board[1][3] = "R";
    board[1][5] = "R";

    let state = updateGameState(board, 1, 0, 1, 3, "w", gameState, boards);

    expect(state.gameOver).toBe(true);
    expect(state.gameEndState).toBe("stalemate");
  });

  it("should update when the game is over by 50 move rule", () => {
    let state = { ...gameState, fiftyMoveCounter: 100 };

    state = updateGameState(board, 7, 1, 5, 2, "w", state, boards);
    expect(state.gameEndState).toBe("Draw by 50 move rule");
  });

  it("should not update gameOver when the player has a move", () => {
    for (let i = 0; i < board.length; i++) {
      board[i] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    }
    board[7][4] = "K";
    board[0][4] = "k";

    board[6][4] = "q";
    board[1][4] = "r";
    board[4][2] = "B";

    let state = updateGameState(board, 6, 0, 6, 4, "b", gameState, boards);

    expect(state.gameOver).toBe(false);
    expect(state.gameEndState).toBe("none");
  });
});

describe("insufficientMaterial", () => {
  let board;

  beforeEach(() => {
    board = initializeBoard();
  });

  it("should correctly identify when there is sufficient material", () => {
    for (let i = 0; i < board.length; i++) {
      board[i] = ["-", "-", "-", "-", "-", "-", "-", "-"];
    }
    board[7][4] = "K";
    board[0][4] = "k";
    expect(insufficientMaterial(board)).toBe(true);

    board[4][0] = "P";
    board[3][0] = "p";
    expect(insufficientMaterial(board)).toBe(false);
    board[4][0] = "-";
    board[3][0] = "-";

    board[6][4] = "N";
    board[1][4] = "b";
    expect(insufficientMaterial(board)).toBe(true);

    board[6][4] = "R";
    expect(insufficientMaterial(board)).toBe(false);

    board[6][4] = "N";
    board[5][2] = "B";
    expect(insufficientMaterial(board)).toBe(false);
  });
});

describe("simulateMove", () => {
  let board;

  beforeEach(() => {
    board = initializeBoard();
  });

  it("should move a piece to an empty square", () => {
    const move = [
      [6, 4],
      [4, 4],
    ];
    const newBoard = simulateMove(board, move);
    expect(newBoard[4][4]).toBe("P");
    expect(newBoard[6][4]).toBe("-");
  });

  it("should capture a piece", () => {
    board[3][3] = "p";
    board[4][4] = "P";
    const move = [
      [4, 4],
      [3, 3],
    ];
    const newBoard = simulateMove(board, move);
    expect(newBoard[3][3]).toBe("P");
    expect(newBoard[4][4]).toBe("-");
  });

  it("should castle kingside", () => {
    board[7][5] = "-";
    board[7][6] = "-";

    const move = [
      [7, 4],
      [7, 6],
    ];
    const newBoard = simulateMove(board, move);
    expect(newBoard[7][6]).toBe("K");
    expect(newBoard[7][5]).toBe("R");
    expect(newBoard[7][4]).toBe("-");
    expect(newBoard[7][7]).toBe("-");
  });

  it("should castle queenside", () => {
    board[7][1] = "-";
    board[7][2] = "-";
    board[7][3] = "-";

    const move = [
      [7, 4],
      [7, 2],
    ];
    const newBoard = simulateMove(board, move);
    expect(newBoard[7][2]).toBe("K");
    expect(newBoard[7][3]).toBe("R");
    expect(newBoard[7][4]).toBe("-");
    expect(newBoard[7][0]).toBe("-");
  });

  it("should handle en passant", () => {
    board[3][3] = "p"; // Black pawn at d4
    board[3][4] = "P"; // White pawn at e2
    const move = [
      [3, 4],
      [2, 3],
    ];
    let newBoard = simulateMove(board, move);

    expect(newBoard[2][3]).toBe("P");
    expect(newBoard[3][3]).toBe("-");
    expect(newBoard[3][4]).toBe("-");
  });
});

describe("sortMoves", () => {
  let board;
  let moves;

  beforeEach(() => {
    // Sample board setup (8x8)
    board = [
      ["q", "-", "-", "-", "k", "b", "n", "r"],
      ["-", "P", "-", "p", "p", "p", "p", "p"],
      ["p", "p", "p", "-", "-", "-", "-", "-"],
      ["-", "-", "-", "-", "-", "-", "-", "-"],
      ["n", "-", "P", "P", "-", "-", "-", "B"],
      ["-", "-", "N", "-", "-", "P", "q", "-"],
      ["P", "P", "-", "-", "-", "P", "B", "P"],
      ["R", "-", "-", "Q", "K", "-", "-", "R"],
    ];

    moves = [
      [
        [6, 1],
        [4, 1],
      ], // Move pawn
      [
        [5, 2],
        [4, 0], 
      ], // Knight captures knight
      [
        [6, 7],
        [5, 6],
      ], // Pawn Captures Queen
      [
        [4, 7],
        [5, 6],
      ], // Bishop captures queen
    ];
  });

  it("sorts moves by capture value difference", () => {
    const sortedMoves = sortMoves(board, moves);
    console.log(sortedMoves);

    expect(sortedMoves[0]).toEqual([
      [6, 7],
      [5, 6],
    ]); // Pawn takes queen
    expect(sortedMoves[1]).toEqual([
      [4, 7],
      [5, 6],
    ]); // Bishop takes queen
    expect(sortedMoves[2]).toEqual([
      [5, 2],
      [4, 0], 
    ]); // Knight takes knight
    expect(sortedMoves[3]).toEqual([
      [6, 1],
      [4, 1],
    ]); // Pawn move
  });

  it("does not modify the original moves array", () => {
    const originalMoves = [...moves.map((move) => [...move])];
    
    sortMoves(board, moves);
    
    expect(moves).toEqual(originalMoves);
  });

  it("handles empty move list", () => {
    expect(sortMoves(board, [])).toEqual([]);
  });

  it("treats promotion as promoting piece", () => {
    const promotionMove = [[1, 1], [0, 0], "R"];
    moves.push(promotionMove);

    const sortedMoves = sortMoves(board, moves);
    expect(sortedMoves[2]).toEqual(promotionMove);
  });
});

describe("canPieceAttackSquare", () => {
  let board;

  beforeEach(() => {
    board = [
      ["-", "-", "-", "-", "-", "-", "-", "-"],
      ["-", "-", "-", "-", "-", "-", "-", "-"],
      ["-", "-", "-", "-", "-", "-", "-", "-"],
      ["-", "-", "-", "-", "-", "-", "-", "-"],
      ["-", "-", "-", "-", "-", "-", "-", "-"],
      ["-", "-", "-", "-", "-", "-", "-", "-"],
      ["-", "-", "-", "-", "-", "-", "-", "-"],
      ["-", "-", "-", "-", "-", "-", "-", "-"],
    ];
  });

  it("should return true if a white pawn can attack diagonally", () => {
    board[4][4] = "P"; 
    expect(canPieceAttackSquare(board, 4, 4, 3, 3)).toBe(true);
    expect(canPieceAttackSquare(board, 4, 4, 3, 5)).toBe(true);
  });

  it("should return false if a white pawn cannot attack forward", () => {
    board[4][4] = "P";
    expect(canPieceAttackSquare(board, 4, 4, 3, 4)).toBe(false);
  });

  it("should return true if a black pawn can attack diagonally", () => {
    board[4][4] = "p";
    expect(canPieceAttackSquare(board, 4, 4, 5, 3)).toBe(true);
    expect(canPieceAttackSquare(board, 4, 4, 5, 5)).toBe(true);
  });

  it("should return false if a black pawn cannot attack forward", () => {
    board[4][4] = "p";
    expect(canPieceAttackSquare(board, 4, 4, 5, 4)).toBe(false);
  });

  it("should return true if a knight can attack in an L-shape", () => {
    board[4][4] = "N";
    expect(canPieceAttackSquare(board, 4, 4, 6, 5)).toBe(true);
    expect(canPieceAttackSquare(board, 4, 4, 6, 3)).toBe(true);
    expect(canPieceAttackSquare(board, 4, 4, 2, 5)).toBe(true);
    expect(canPieceAttackSquare(board, 4, 4, 2, 3)).toBe(true);
  });

  it("should return false if a knight cannot attack an invalid square", () => {
    board[4][4] = "N";
    expect(canPieceAttackSquare(board, 4, 4, 4, 6)).toBe(false);
  });

  it("should return true if a bishop can attack diagonally", () => {
    board[4][4] = "B";
    expect(canPieceAttackSquare(board, 4, 4, 6, 6)).toBe(true);
    expect(canPieceAttackSquare(board, 4, 4, 2, 2)).toBe(true);
  });

  it("should return false if a bishop cannot attack when obstructed", () => {
    board[4][4] = "B";
    board[5][5] = "P"; 
    expect(canPieceAttackSquare(board, 4, 4, 6, 6)).toBe(false);
  });

  it("should return true if a rook can attack along rows or columns", () => {
    board[4][4] = "R";
    expect(canPieceAttackSquare(board, 4, 4, 4, 7)).toBe(true);
    expect(canPieceAttackSquare(board, 4, 4, 7, 4)).toBe(true);
  });

  it("should return false if a rook cannot attack when obstructed", () => {
    board[4][4] = "R";
    board[4][6] = "P"; 
    expect(canPieceAttackSquare(board, 4, 4, 4, 7)).toBe(false);
  });

  it("should return true if a queen can attack diagonally, horizontally, or vertically", () => {
    board[4][4] = "Q";
    expect(canPieceAttackSquare(board, 4, 4, 7, 4)).toBe(true);
    expect(canPieceAttackSquare(board, 4, 4, 4, 7)).toBe(true);
    expect(canPieceAttackSquare(board, 4, 4, 7, 7)).toBe(true);
  });

  it("should return false if a queen cannot attack due to obstruction", () => {
    board[4][4] = "Q";
    board[6][6] = "P";
    expect(canPieceAttackSquare(board, 4, 4, 7, 7)).toBe(false);
  });

  it("should return true if a king can attack one square in any direction", () => {
    board[4][4] = "K";
    expect(canPieceAttackSquare(board, 4, 4, 5, 4)).toBe(true);
    expect(canPieceAttackSquare(board, 4, 4, 5, 5)).toBe(true);
    expect(canPieceAttackSquare(board, 4, 4, 3, 3)).toBe(true);
  });

  it("should return false if a king tries to attack more than one square away", () => {
    board[4][4] = "K";
    expect(canPieceAttackSquare(board, 4, 4, 6, 6)).toBe(false);
  });
});

describe("doesMovePutInCheck", () => {
  let board, gameState;

  beforeEach(() => {
    board = [
      ["r", "n", "b", "q", "k", "b", "n", "r"],
      ["p", "p", "p", "p", "p", "p", "p", "p"],
      ["-", "-", "-", "-", "-", "-", "-", "-"],
      ["-", "-", "-", "-", "-", "-", "-", "-"],
      ["-", "-", "-", "-", "-", "-", "-", "-"],
      ["-", "-", "-", "-", "-", "-", "-", "-"],
      ["P", "P", "P", "P", "P", "P", "P", "P"],
      ["R", "N", "B", "Q", "K", "B", "N", "R"],
    ];

    gameState = {
      kingPosition: {
        w: [7, 4],
        b: [0, 4],
      },
    };
  });

  it("should return false when a move does not put the player in check", () => {
    const move = [[6, 4], [4, 4]];

    expect(doesMovePutInCheck(board, "w", move, gameState)).toBe(false);
  });

  it("should return true when a move puts the player in check", () => {
    const move = [[6, 5], [4, 5]];

    board[0][3] = "-"; 
    board[4][7] = "q"; 

    expect(doesMovePutInCheck(board, "w", move, gameState)).toBe(true);
  });

  it("be false when the king moves out of check", () => {
    const move = [[7, 4], [6, 4]]; 
    board[6][5] = '-';
    board[4][5] = 'P';
    board[6][4] = '-';
    board[0][3] = "-"; 
    board[4][7] = "q"; 

    expect(doesMovePutInCheck(board, "w", move, gameState)).toBe(false);
  });

  it("should not modify the board state directly", () => {
    const move = [[6, 4], [4, 4]]; 

    const boardCopy = board.map(row => [...row]); 

    doesMovePutInCheck(board, "w", move, gameState);

    expect(board).toEqual(boardCopy); 
  });
});