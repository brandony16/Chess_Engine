import { describe, expect, test } from "vitest";
import { Position } from "../../../game/Position.ts";
import {
  ACTIVE_KING_ENDGAME,
  ALT_PERFT,
  EN_PASSANT_BLACK,
  EN_PASSANT_WHITE,
  KIWIPETE_POS,
  OPEN_MIDGAME,
  PROMOTION_ENDGAME,
  START_POS,
} from "../fens.ts";
import {
  BLACK,
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  NO_PIECE,
  sq,
  WHITE,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../../../game/chessConstants.ts";
import { isRook } from "../../../game/pieceUtils/pieceClassifiers.ts";
import {
  encodeMove,
  FLAG_CASTLE,
  FLAG_EP,
  isCastling,
  moveFrom,
  movePiece,
  movePromotion,
  moveTo,
  type Move,
} from "../../../game/moveMaking/move.ts";

const confirmMove = (pos: Position, move: Move) => {
  const from = moveFrom(move);
  const to = moveTo(move);

  expect(pos.pieceAt[from]).toBe(NO_PIECE);

  if (movePromotion(move) === NO_PIECE) {
    expect(pos.pieceAt[to]).toBe(movePiece(move));
  } else {
    expect(pos.pieceAt[to]).toBe(movePromotion(move));
  }

  if (isCastling(move)) {
    if (from > to) {
      // Queenside
      expect(pos.pieceAt[from - 4]).toBe(NO_PIECE);
      expect(isRook(pos.pieceAt[from - 1])).toBe(true);
    } else {
      // Kingside
      expect(pos.pieceAt[from + 3]).toBe(NO_PIECE);
      expect(isRook(pos.pieceAt[from + 1])).toBe(true);
    }
  }

  const zobrist = pos.zobristKey;
  pos.computeZobrist();
  expect(zobrist).toBe(pos.zobristKey);

  expect(pos.moveStack[pos.moveStack.length - 1]).toBe(move);
  expect(pos.zobristHistory[pos.ply - 1]).toBe(pos.zobristKey);
};

describe("makeMove - movement", () => {
  test("pawn - single move", () => {
    const pos = new Position();
    pos.loadFen(START_POS);

    const moveW = encodeMove(sq.A2, sq.A3, WHITE_PAWN);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);
    confirmMove(pos, moveW);

    const moveB = encodeMove(sq.D7, sq.D6, BLACK_PAWN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);
    confirmMove(pos, moveB);
  });

  test("pawn - double move", () => {
    const pos = new Position();
    pos.loadFen(START_POS);

    const moveW = encodeMove(sq.E2, sq.E4, WHITE_PAWN);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);
    confirmMove(pos, moveW);

    const moveB = encodeMove(sq.H7, sq.H5, BLACK_PAWN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);
    confirmMove(pos, moveB);
  });

  test("knight", () => {
    const pos = new Position();
    pos.loadFen(START_POS);

    const moveW = encodeMove(sq.B1, sq.C3, WHITE_KNIGHT);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);
    confirmMove(pos, moveW);

    const moveB = encodeMove(sq.G8, sq.F6, BLACK_KNIGHT);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);
    confirmMove(pos, moveB);
  });

  test("bishop", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = encodeMove(sq.E2, sq.C4, WHITE_BISHOP);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(sq.G7, sq.H6, BLACK_BISHOP);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });

  test("rook", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = encodeMove(sq.A1, sq.C1, WHITE_ROOK);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(sq.A8, sq.B8, BLACK_ROOK);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });

  test("queen", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = encodeMove(sq.F3, sq.G3, WHITE_QUEEN);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(sq.E7, sq.C5, BLACK_QUEEN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });

  test("king - base movement", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = encodeMove(sq.E1, sq.F1, WHITE_KING);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(sq.E8, sq.D8, BLACK_KING);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });

  test("king - castling", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    // White kingside
    const moveW = encodeMove(
      sq.E1,
      sq.G1,
      WHITE_KING,
      NO_PIECE,
      NO_PIECE,
      FLAG_CASTLE,
    );
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    // Black queenside
    const moveB = encodeMove(
      sq.E8,
      sq.C8,
      BLACK_KING,
      NO_PIECE,
      NO_PIECE,
      FLAG_CASTLE,
    );
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });
});

describe("makeMove - captures", () => {
  test("pawn - normal", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = encodeMove(sq.D5, sq.E6, WHITE_PAWN, BLACK_PAWN);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(sq.B4, sq.C3, BLACK_PAWN, WHITE_KNIGHT);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });

  test("pawn - en passant", () => {
    const pos = new Position();
    pos.loadFen(EN_PASSANT_WHITE);

    const moveW = encodeMove(
      sq.E5,
      sq.D6,
      WHITE_PAWN,
      BLACK_PAWN,
      NO_PIECE,
      FLAG_EP,
    );
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    // pos.loadFen(EN_PASSANT_BLACK);
    // const moveB = encodeMove(
    //   sq.E4,
    //   sq.D3,
    //   BLACK_PAWN,
    //   WHITE_PAWN,
    //   NO_PIECE,
    //   FLAG_EP,
    // );
    // pos.makeMove(moveB);

    // expect(pos.validate()).toBe(true);
    // confirmMove(pos, moveB);
  });

  test("knight", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = encodeMove(sq.E5, sq.G6, WHITE_KNIGHT, BLACK_PAWN);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(sq.B6, sq.D5, BLACK_KNIGHT, WHITE_PAWN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });

  test("bishop", () => {
    const pos = new Position();
    pos.loadFen(ALT_PERFT);

    const moveW = encodeMove(sq.G5, sq.F6, WHITE_BISHOP, BLACK_KNIGHT);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(sq.C5, sq.F2, BLACK_BISHOP, WHITE_PAWN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });

  test("rook", () => {
    const pos = new Position();
    pos.loadFen(OPEN_MIDGAME);

    const moveW = encodeMove(sq.D1, sq.D8, WHITE_ROOK, BLACK_ROOK);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(sq.H8, sq.D8, BLACK_ROOK, WHITE_ROOK);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });

  test("queen", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = encodeMove(sq.F3, sq.F6, WHITE_QUEEN, BLACK_KNIGHT);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(sq.E7, sq.F6, BLACK_QUEEN, WHITE_QUEEN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });

  test("king", () => {
    const pos = new Position();
    pos.loadFen(ACTIVE_KING_ENDGAME);

    const moveW = encodeMove(sq.D5, sq.C5, WHITE_KING, BLACK_PAWN);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(sq.F4, sq.G4, BLACK_KING, WHITE_PAWN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });
});

describe("makeMove - promotion", () => {
  test("knight promo", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    const moveW = encodeMove(sq.C7, sq.C8, WHITE_PAWN, NO_PIECE, WHITE_KNIGHT);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(sq.G2, sq.G1, BLACK_PAWN, NO_PIECE, BLACK_KNIGHT);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });

  test("bishop promo", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    const moveW = encodeMove(sq.C7, sq.C8, WHITE_PAWN, NO_PIECE, WHITE_BISHOP);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(sq.G2, sq.G1, BLACK_PAWN, NO_PIECE, BLACK_BISHOP);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });

  test("rook promo", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    const moveW = encodeMove(sq.C7, sq.C8, WHITE_PAWN, NO_PIECE, WHITE_ROOK);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(sq.G2, sq.G1, BLACK_PAWN, NO_PIECE, BLACK_ROOK);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });

  test("queen promo", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    const moveW = encodeMove(sq.C7, sq.C8, WHITE_PAWN, NO_PIECE, WHITE_QUEEN);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(sq.G2, sq.G1, BLACK_PAWN, NO_PIECE, BLACK_QUEEN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });

  test("knight promo - capture", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    const moveW = encodeMove(
      sq.C7,
      sq.D8,
      WHITE_PAWN,
      BLACK_KNIGHT,
      WHITE_KNIGHT,
    );
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(
      sq.G2,
      sq.F1,
      BLACK_PAWN,
      WHITE_KNIGHT,
      BLACK_KNIGHT,
    );
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });

  test("bishop promo - capture", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    const moveW = encodeMove(
      sq.C7,
      sq.D8,
      WHITE_PAWN,
      BLACK_KNIGHT,
      WHITE_BISHOP,
    );
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(
      sq.G2,
      sq.F1,
      BLACK_PAWN,
      WHITE_KNIGHT,
      BLACK_BISHOP,
    );
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });

  test("rook promo - capture", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    const moveW = encodeMove(
      sq.C7,
      sq.D8,
      WHITE_PAWN,
      BLACK_KNIGHT,
      WHITE_ROOK,
    );
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(
      sq.G2,
      sq.F1,
      BLACK_PAWN,
      WHITE_KNIGHT,
      BLACK_ROOK,
    );
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });

  test("queen promo - capture", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    const moveW = encodeMove(
      sq.C7,
      sq.D8,
      WHITE_PAWN,
      BLACK_KNIGHT,
      WHITE_QUEEN,
    );
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveW);

    const moveB = encodeMove(
      sq.G2,
      sq.F1,
      BLACK_PAWN,
      WHITE_KNIGHT,
      BLACK_QUEEN,
    );
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    confirmMove(pos, moveB);
  });
});
