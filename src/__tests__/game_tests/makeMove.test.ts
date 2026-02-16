import { describe, expect, test } from "vitest";
import { Position } from "../../game/Position.ts";
import {
  ACTIVE_KING_ENDGAME,
  ALT_PERFT,
  EN_PASSANT_BLACK,
  EN_PASSANT_WHITE,
  KIWIPETE_POS,
  OPEN_MIDGAME,
  PINNED_POS,
  PROMOTION_ENDGAME,
  START_POS,
} from "./fens.ts";
import Move from "../../game/moveMaking/move.ts";
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
} from "../../game/chessConstants.ts";

describe("makeMove - movement", () => {
  test("pawn - single move", () => {
    const pos = new Position();
    pos.loadFen(START_POS);

    const moveW = new Move(sq.A2, sq.A3, WHITE_PAWN);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    const moveB = new Move(sq.D7, sq.D6, BLACK_PAWN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);
  });

  test("pawn - double move", () => {
    const pos = new Position();
    pos.loadFen(START_POS);

    const moveW = new Move(sq.E2, sq.E4, WHITE_PAWN);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    const moveB = new Move(sq.H7, sq.H5, BLACK_PAWN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);
  });

  test("knight", () => {
    const pos = new Position();
    pos.loadFen(START_POS);

    const moveW = new Move(sq.B1, sq.C3, WHITE_KNIGHT);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(BLACK);

    const moveB = new Move(sq.G8, sq.F6, BLACK_KNIGHT);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
    expect(pos.sideToMove).toBe(WHITE);
  });

  test("bishop", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = new Move(sq.E2, sq.C4, WHITE_BISHOP);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.G7, sq.H6, BLACK_BISHOP);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("rook", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = new Move(sq.A1, sq.C1, WHITE_ROOK);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.A8, sq.B8, BLACK_ROOK);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("queen", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = new Move(sq.F3, sq.G3, WHITE_QUEEN);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.E7, sq.C5, BLACK_QUEEN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("king - base movement", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = new Move(sq.E1, sq.F1, WHITE_KING);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.E8, sq.D8, BLACK_KING);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("king - castling", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    // White kingside
    const moveW = new Move(sq.E1, sq.G1, WHITE_KING, NO_PIECE, NO_PIECE, true);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    // Black queenside
    const moveB = new Move(sq.E8, sq.C8, BLACK_KING, NO_PIECE, NO_PIECE, true);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });
});

describe("makeMove - captures", () => {
  test("pawn - normal", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = new Move(sq.D5, sq.E6, WHITE_PAWN, BLACK_PAWN);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.B4, sq.C3, BLACK_PAWN, WHITE_KNIGHT);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("pawn - en passant", () => {
    const pos = new Position();
    pos.loadFen(EN_PASSANT_WHITE);

    const moveW = new Move(
      sq.E5,
      sq.D6,
      WHITE_PAWN,
      BLACK_PAWN,
      NO_PIECE,
      false,
      true,
    );
    pos.makeMove(moveW);
    expect(pos.validate()).toBe(true);

    pos.loadFen(EN_PASSANT_BLACK);
    const moveB = new Move(
      sq.E4,
      sq.D3,
      BLACK_PAWN,
      WHITE_PAWN,
      NO_PIECE,
      false,
      true,
    );
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("knight", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = new Move(sq.E5, sq.G6, WHITE_KNIGHT, BLACK_PAWN);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.B6, sq.D5, BLACK_KNIGHT, WHITE_PAWN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("bishop", () => {
    const pos = new Position();
    pos.loadFen(ALT_PERFT);

    const moveW = new Move(sq.G5, sq.F6, WHITE_BISHOP, BLACK_KNIGHT);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.C5, sq.F2, BLACK_BISHOP, WHITE_PAWN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("rook", () => {
    const pos = new Position();
    pos.loadFen(OPEN_MIDGAME);

    const moveW = new Move(sq.D1, sq.D8, WHITE_ROOK, BLACK_ROOK);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.H8, sq.D8, BLACK_ROOK, WHITE_ROOK);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("queen", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const moveW = new Move(sq.F3, sq.F6, WHITE_QUEEN, BLACK_KNIGHT);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.E7, sq.F6, BLACK_QUEEN, WHITE_QUEEN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("king", () => {
    const pos = new Position();
    pos.loadFen(ACTIVE_KING_ENDGAME);

    const moveW = new Move(sq.D5, sq.C5, WHITE_KING, BLACK_PAWN);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.F4, sq.G4, BLACK_KING, WHITE_PAWN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });
});

describe("makeMove - promotion", () => {
  test("knight promo", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    const moveW = new Move(sq.C7, sq.C8, WHITE_PAWN, NO_PIECE, WHITE_KNIGHT);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.G2, sq.G1, BLACK_PAWN, NO_PIECE, BLACK_KNIGHT);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("bishop promo", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    const moveW = new Move(sq.C7, sq.C8, WHITE_PAWN, NO_PIECE, WHITE_BISHOP);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.G2, sq.G1, BLACK_PAWN, NO_PIECE, BLACK_BISHOP);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("rook promo", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    const moveW = new Move(sq.C7, sq.C8, WHITE_PAWN, NO_PIECE, WHITE_ROOK);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.G2, sq.G1, BLACK_PAWN, NO_PIECE, BLACK_ROOK);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("queen promo", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    const moveW = new Move(sq.C7, sq.C8, WHITE_PAWN, NO_PIECE, WHITE_QUEEN);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.G2, sq.G1, BLACK_PAWN, NO_PIECE, BLACK_QUEEN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("knight promo - capture", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    const moveW = new Move(sq.C7, sq.D8, WHITE_PAWN, BLACK_KNIGHT, WHITE_KNIGHT);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.G2, sq.F1, BLACK_PAWN, WHITE_KNIGHT, BLACK_KNIGHT);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("bishop promo - capture", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    const moveW = new Move(sq.C7, sq.D8, WHITE_PAWN, BLACK_KNIGHT, WHITE_BISHOP);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.G2, sq.F1, BLACK_PAWN, WHITE_KNIGHT, BLACK_BISHOP);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("rook promo - capture", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    const moveW = new Move(sq.C7, sq.D8, WHITE_PAWN, BLACK_KNIGHT, WHITE_ROOK);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.G2, sq.F1, BLACK_PAWN, WHITE_KNIGHT, BLACK_ROOK);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });

  test("queen promo - capture", () => {
    const pos = new Position();
    pos.loadFen(PROMOTION_ENDGAME);

    const moveW = new Move(sq.C7, sq.D8, WHITE_PAWN, BLACK_KNIGHT, WHITE_QUEEN);
    pos.makeMove(moveW);

    expect(pos.validate()).toBe(true);

    const moveB = new Move(sq.G2, sq.F1, BLACK_PAWN, WHITE_KNIGHT, BLACK_QUEEN);
    pos.makeMove(moveB);

    expect(pos.validate()).toBe(true);
  });
});
