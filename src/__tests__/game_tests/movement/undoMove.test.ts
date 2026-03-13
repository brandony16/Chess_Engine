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
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  NO_PIECE,
  sq,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../../../game/chessConstants.ts";
import {
  encodeMove,
  FLAG_CASTLE,
  FLAG_EP,
  type Move,
} from "../../../game/moveMaking/move.ts";

function areEqual(pos1: Position, pos2: Position): void {
  // Zobrist covers pieces, sideToMove, castling, and en passant
  expect(pos1.zobristKey).toBe(pos2.zobristKey);

  expect(pos1.result).toBe(pos2.result);
  expect(pos1.endState).toBe(pos2.endState);
  expect(pos1.halfmoveClock).toBe(pos2.halfmoveClock);
  expect(pos1.fullmoveNumber).toBe(pos2.fullmoveNumber);

  expect(pos1.moveStack.length).toBe(pos2.moveStack.length);

  expect(pos1.ply).toBe(pos2.ply);
  expect(pos1.searchPly).toBe(pos2.searchPly);

  for (let i = 0; i < pos1.ply; i++) {
    expect(pos1.zobristHistory[i]).toBe(pos2.zobristHistory[i]);
    expect(pos1.undoCastling[i]).toBe(pos2.undoCastling[i]);
    expect(pos1.undoEp[i]).toBe(pos2.undoEp[i]);
    expect(pos1.undoHalfmove[i]).toBe(pos2.undoHalfmove[i]);
  }
}

function testUndo(fen: string, move1: Move, move2: Move) {
  const pos = new Position();
  pos.loadFen(fen);

  pos.makeMove(move1);

  const pos2 = pos.copy();

  pos.makeMove(move2);

  pos.unmakeMove(); // Unmake black move
  areEqual(pos, pos2);
  expect(pos.validate()).toBe(true);

  pos.unmakeMove(); // Unmake white move - back to initial pos

  const pos3 = new Position();
  pos3.loadFen(fen);
  areEqual(pos, pos3);
  expect(pos.validate()).toBe(true);
}

describe("unmakeMove - movement", () => {
  test("pawn - single move", () => {
    const moveW = encodeMove(sq.A2, sq.A3, WHITE_PAWN);
    const moveB = encodeMove(sq.D7, sq.D6, BLACK_PAWN);

    testUndo(START_POS, moveW, moveB);
  });

  test("pawn - double move", () => {
    const moveW = encodeMove(sq.E2, sq.E4, WHITE_PAWN);
    const moveB = encodeMove(sq.H7, sq.H5, BLACK_PAWN);

    testUndo(START_POS, moveW, moveB);
  });

  test("knight", () => {
    const moveW = encodeMove(sq.B1, sq.C3, WHITE_KNIGHT);
    const moveB = encodeMove(sq.G8, sq.F6, BLACK_KNIGHT);

    testUndo(START_POS, moveW, moveB);
  });

  test("bishop", () => {
    const moveW = encodeMove(sq.E2, sq.C4, WHITE_BISHOP);
    const moveB = encodeMove(sq.G7, sq.H6, BLACK_BISHOP);

    testUndo(KIWIPETE_POS, moveW, moveB);
  });

  test("rook", () => {
    const moveW = encodeMove(sq.A1, sq.C1, WHITE_ROOK);
    const moveB = encodeMove(sq.A8, sq.B8, BLACK_ROOK);

    testUndo(KIWIPETE_POS, moveW, moveB);
  });

  test("queen", () => {
    const moveW = encodeMove(sq.F3, sq.G3, WHITE_QUEEN);
    const moveB = encodeMove(sq.E7, sq.C5, BLACK_QUEEN);

    testUndo(KIWIPETE_POS, moveW, moveB);
  });

  test("king - base movement", () => {
    const moveW = encodeMove(sq.E1, sq.F1, WHITE_KING);
    const moveB = encodeMove(sq.E8, sq.D8, BLACK_KING);

    testUndo(KIWIPETE_POS, moveW, moveB);
  });

  test("king - castling", () => {
    // White kingside and black queenside
    const moveW = encodeMove(
      sq.E1,
      sq.G1,
      WHITE_KING,
      NO_PIECE,
      NO_PIECE,
      FLAG_CASTLE,
    );
    const moveB = encodeMove(
      sq.E8,
      sq.C8,
      BLACK_KING,
      NO_PIECE,
      NO_PIECE,
      FLAG_CASTLE,
    );

    testUndo(KIWIPETE_POS, moveW, moveB);
  });
});

describe("unmakeMove - captures", () => {
  test("pawn - normal", () => {
    const moveW = encodeMove(sq.D5, sq.E6, WHITE_PAWN, BLACK_PAWN);
    const moveB = encodeMove(sq.B4, sq.C3, BLACK_PAWN, WHITE_KNIGHT);

    testUndo(KIWIPETE_POS, moveW, moveB);
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
    pos.unmakeMove();

    const posW = new Position();
    posW.loadFen(EN_PASSANT_WHITE);
    areEqual(pos, posW);
    expect(pos.validate()).toBe(true);

    pos.loadFen(EN_PASSANT_BLACK);
    const moveB = encodeMove(
      sq.E4,
      sq.D3,
      BLACK_PAWN,
      WHITE_PAWN,
      NO_PIECE,
      FLAG_EP,
    );
    pos.makeMove(moveB);
    pos.unmakeMove();

    const posB = new Position();
    posB.loadFen(EN_PASSANT_BLACK);
    areEqual(pos, posB);
    expect(pos.validate()).toBe(true);
  });

  test("knight", () => {
    const moveW = encodeMove(sq.E5, sq.G6, WHITE_KNIGHT, BLACK_PAWN);
    const moveB = encodeMove(sq.B6, sq.D5, BLACK_KNIGHT, WHITE_PAWN);

    testUndo(KIWIPETE_POS, moveW, moveB);
  });

  test("bishop", () => {
    const moveW = encodeMove(sq.G5, sq.F6, WHITE_BISHOP, BLACK_KNIGHT);
    const moveB = encodeMove(sq.C5, sq.F2, BLACK_BISHOP, WHITE_PAWN);

    testUndo(ALT_PERFT, moveW, moveB);
  });

  test("rook", () => {
    const moveW = encodeMove(sq.D1, sq.D8, WHITE_ROOK, BLACK_ROOK);
    const moveB = encodeMove(sq.H8, sq.D8, BLACK_ROOK, WHITE_ROOK);

    testUndo(OPEN_MIDGAME, moveW, moveB);
  });

  test("queen", () => {
    const moveW = encodeMove(sq.F3, sq.F6, WHITE_QUEEN, BLACK_KNIGHT);
    const moveB = encodeMove(sq.E7, sq.F6, BLACK_QUEEN, WHITE_QUEEN);

    testUndo(KIWIPETE_POS, moveW, moveB);
  });

  test("king", () => {
    const moveW = encodeMove(sq.D5, sq.C5, WHITE_KING, BLACK_PAWN);
    const moveB = encodeMove(sq.F4, sq.G4, BLACK_KING, WHITE_PAWN);

    testUndo(ACTIVE_KING_ENDGAME, moveW, moveB);
  });
});

describe("unmakeMove - promotions", () => {
  test("knight promo", () => {
    const moveW = encodeMove(sq.C7, sq.C8, WHITE_PAWN, NO_PIECE, WHITE_KNIGHT);
    const moveB = encodeMove(sq.G2, sq.G1, BLACK_PAWN, NO_PIECE, BLACK_KNIGHT);

    testUndo(PROMOTION_ENDGAME, moveW, moveB);
  });
  test("bishop promo", () => {
    const moveW = encodeMove(sq.C7, sq.C8, WHITE_PAWN, NO_PIECE, WHITE_BISHOP);
    const moveB = encodeMove(sq.G2, sq.G1, BLACK_PAWN, NO_PIECE, BLACK_BISHOP);

    testUndo(PROMOTION_ENDGAME, moveW, moveB);
  });

  test("rook promo", () => {
    const moveW = encodeMove(sq.C7, sq.C8, WHITE_PAWN, NO_PIECE, WHITE_ROOK);
    const moveB = encodeMove(sq.G2, sq.G1, BLACK_PAWN, NO_PIECE, BLACK_ROOK);

    testUndo(PROMOTION_ENDGAME, moveW, moveB);
  });

  test("queen promo", () => {
    const moveW = encodeMove(sq.C7, sq.C8, WHITE_PAWN, NO_PIECE, WHITE_QUEEN);
    const moveB = encodeMove(sq.G2, sq.G1, BLACK_PAWN, NO_PIECE, BLACK_QUEEN);

    testUndo(PROMOTION_ENDGAME, moveW, moveB);
  });

  test("knight promo - capture", () => {
    const moveW = encodeMove(
      sq.C7,
      sq.D8,
      WHITE_PAWN,
      BLACK_KNIGHT,
      WHITE_KNIGHT,
    );
    const moveB = encodeMove(
      sq.G2,
      sq.F1,
      BLACK_PAWN,
      WHITE_KNIGHT,
      BLACK_KNIGHT,
    );

    testUndo(PROMOTION_ENDGAME, moveW, moveB);
  });

  test("bishop promo - capture", () => {
    const moveW = encodeMove(
      sq.C7,
      sq.D8,
      WHITE_PAWN,
      BLACK_KNIGHT,
      WHITE_BISHOP,
    );
    const moveB = encodeMove(
      sq.G2,
      sq.F1,
      BLACK_PAWN,
      WHITE_KNIGHT,
      BLACK_BISHOP,
    );

    testUndo(PROMOTION_ENDGAME, moveW, moveB);
  });

  test("rook promo - capture", () => {
    const moveW = encodeMove(
      sq.C7,
      sq.D8,
      WHITE_PAWN,
      BLACK_KNIGHT,
      WHITE_ROOK,
    );
    const moveB = encodeMove(
      sq.G2,
      sq.F1,
      BLACK_PAWN,
      WHITE_KNIGHT,
      BLACK_ROOK,
    );

    testUndo(PROMOTION_ENDGAME, moveW, moveB);
  });

  test("queen promo - capture", () => {
    const moveW = encodeMove(
      sq.C7,
      sq.D8,
      WHITE_PAWN,
      BLACK_KNIGHT,
      WHITE_QUEEN,
    );
    const moveB = encodeMove(
      sq.G2,
      sq.F1,
      BLACK_PAWN,
      WHITE_KNIGHT,
      BLACK_QUEEN,
    );

    testUndo(PROMOTION_ENDGAME, moveW, moveB);
  });
});
