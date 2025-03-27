import { jest } from "@jest/globals";

let makeMove;
let makeCastleMove;
let getPieceAtSquare;
let pieceSymbols;

beforeAll(async () => {
  // Mock each module separately
  jest.unstable_mockModule("../components/bitboardUtils/bbHelpers.js", () => ({
    getPieceAtSquare: jest.fn(), 

    pieceSymbols: {
      whiteKings: "K",
      blackKings: "k",
      whitePawns: "P",
      blackPawns: "p",
      whiteQueen: "Q",
      blackQueen: "q",
    },
  }));

  jest.unstable_mockModule("../components/bitboardUtils/bbChessLogic.js", () => ({
    makeMove: jest.fn(),
    makeCastleMove: jest.fn(),
  }));

  // Import the actual mocked modules
  const bbHelpers = await import("../components/bitboardUtils/bbHelpers.js");
  const bbChessLogic = await import("../components/bitboardUtils/bbChessLogic.js");
  makeMove = bbChessLogic.makeMove;
  makeCastleMove = bbChessLogic.makeCastleMove;
  getPieceAtSquare = bbHelpers.getPieceAtSquare;
  pieceSymbols = bbHelpers.pieceSymbols;
});

describe("makeMove", () => {
  let initialBitboards;

  beforeEach(() => {
    jest.clearAllMocks();
    initialBitboards = {
      whiteKings: 0n,
      blackKings: 0n,
      whitePawns: 0n,
      blackPawns: 0n,
      whiteQueen: 0n,
      blackQueen: 0n,
    };
  });

  test("handles castling moves", () => {
    // Arrange: simulate a king move that is a castle (abs(to - from) === 2)
    const from = 4;
    const to = 6;
    // Let getPieceAtSquare return a king piece (using whiteKings for example)
    getPieceAtSquare.mockReturnValue("whiteKings");
    // Simulate castle move result
    const castleResult = { castled: true };
    makeCastleMove.mockReturnValue(castleResult);

    // Act
    const result = makeMove(initialBitboards, from, to);

    // Assert: makeCastleMove is called and its result is returned
    expect(makeCastleMove).toHaveBeenCalledWith(initialBitboards, from, to);
    expect(result).toEqual(castleResult);
  });

  test("performs a normal move (no capture, no en passant, no promotion)", () => {
    // Arrange: move a white pawn from square 8 to square 16.
    const from = 8;
    const to = 16;
    // Set white pawn on square 8.
    initialBitboards.whitePawns = 1n << BigInt(from);
    // Let getPieceAtSquare return whitePawns when asked.
    getPieceAtSquare.mockReturnValue("whitePawns");

    // Act
    const result = makeMove(initialBitboards, from, to);

    // Assert: the pawn is removed from square 8 and placed on square 16.
    const updatedWhitePawns = result.bitboards.whitePawns;
    expect(updatedWhitePawns & (1n << BigInt(from))).toBe(0n);
    expect(updatedWhitePawns & (1n << BigInt(to))).not.toBe(0n);
    // There is no en passant square and no capture.
    expect(result.enPassantSquare).toBeNull();
    expect(result.isCapture).toBe(false);
  });

  test("handles capture moves", () => {
    // Arrange: white pawn on square 8 moves to square 16 where a black pawn is present.
    const from = 8;
    const to = 16;
    initialBitboards.whitePawns = 1n << BigInt(from);
    initialBitboards.blackPawns = 1n << BigInt(to);
    getPieceAtSquare.mockReturnValue("whitePawns");

    // Act
    const result = makeMove(initialBitboards, from, to);

    // Assert:
    // White pawn moved
    const updatedWhitePawns = result.bitboards.whitePawns;
    expect(updatedWhitePawns & (1n << BigInt(from))).toBe(0n);
    expect(updatedWhitePawns & (1n << BigInt(to))).not.toBe(0n);
    // Black pawn has been captured.
    const updatedBlackPawns = result.bitboards.blackPawns;
    expect(updatedBlackPawns & (1n << BigInt(to))).toBe(0n);
    // isCapture flag is true.
    expect(result.isCapture).toBe(true);
  });

  test("handles promotion moves", () => {
    // Arrange: white pawn on square 8 moves to square 16 with promotion.
    const from = 8;
    const to = 16;
    const promotionPiece = "Queen"; // Will result in key 'whiteQueen'
    initialBitboards.whitePawns = 1n << BigInt(from);
    getPieceAtSquare.mockReturnValue("whitePawns");

    // Act
    const result = makeMove(initialBitboards, from, to, null, promotionPiece);

    // Assert:
    // The pawn should be removed from whitePawns
    expect(result.bitboards.whitePawns & (1n << BigInt(from))).toBe(0n);
    // Instead of moving to 'to', the promoted piece is added.
    expect(result.bitboards.whiteQueen & (1n << BigInt(to))).not.toBe(0n);
    // No en passant square should be returned.
    expect(result.enPassantSquare).toBeNull();
  });

  test("handles en passant moves without capture (double-step move sets en passant square)", () => {
    // Arrange: white pawn makes a double-step move.
    const from = 8;
    const to = 24; // Difference of 16 indicates a double-step.
    initialBitboards.whitePawns = 1n << BigInt(from);
    getPieceAtSquare.mockReturnValue("whitePawns");

    // Act
    const result = makeMove(initialBitboards, from, to);

    // Assert:
    // The pawn should be moved from square 8 to 24.
    expect(result.bitboards.whitePawns & (1n << BigInt(from))).toBe(0n);
    expect(result.bitboards.whitePawns & (1n << BigInt(to))).not.toBe(0n);
    // En passant square for white is to - 8.
    expect(result.enPassantSquare).toBe(to - 8);
    // Not a capture.
    expect(result.isCapture).toBe(false);
  });

  test("handles en passant capture", () => {
    // Arrange: white pawn is moving to the en passant square where a black pawn should be captured.
    // For white, when moving en passant, captured pawn is at (to - 8).
    const from = 25;
    const to = 17; // enPassantSquare is provided and equals destination.
    const enPassantSquare = to;
    initialBitboards.whitePawns = 1n << BigInt(from);
    // Place black pawn at square (to - 8) = 9.
    initialBitboards.blackPawns = 1n << BigInt(9);
    getPieceAtSquare.mockReturnValue("whitePawns");

    // Act
    const result = makeMove(initialBitboards, from, to, enPassantSquare);

    // Assert:
    // White pawn moved from 25 to 17.
    expect(result.bitboards.whitePawns & (1n << BigInt(from))).toBe(0n);
    expect(result.bitboards.whitePawns & (1n << BigInt(to))).not.toBe(0n);
    // Black pawn at square 9 should be captured.
    expect(result.bitboards.blackPawns & (1n << BigInt(9))).toBe(0n);
    // Since this move is a capture, isCapture should be true.
    expect(result.isCapture).toBe(true);
  });
});
