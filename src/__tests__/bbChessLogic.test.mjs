import { isInCheck, isSquareAttacked } from "../components/bitboardUtils/bbChessLogic";
import * as C from "../components/bitboardUtils/constants";
import { getFENData } from "../components/bitboardUtils/FENandUCIHelpers";
import { getAttackMask } from "../components/bitboardUtils/PieceMasks/attackMask";
import { computeAllAttackMasks } from "../components/bitboardUtils/PieceMasks/individualAttackMasks";
import { jest } from "@jest/globals";

function emptyBitboards() {
  return new BigUint64Array(12).fill(0n);
}

// helper: place a piece on a square
function placePiece(bbArray, pieceIndex, square) {
  bbArray[pieceIndex] = (bbArray[pieceIndex] || 0n) | (1n << BigInt(square));
}

describe("isSquareAttacked", () => {
  const kiwipeteFEN =
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
  const fenData = getFENData(kiwipeteFEN);
  const bitboards = fenData.bitboards;

  computeAllAttackMasks(bitboards);
  const whiteAttackMask = getAttackMask(C.WHITE);
  const blackAttackMask = getAttackMask(C.BLACK);

  test("White attacks", () => {
    const notAttacked = [
      0, 7, 9, 10, 25, 27, 31, 32, 34, 36, 41, 43, 48, 49, 50, 52, 54, 55, 56,
      57, 58, 59, 60, 61, 62, 63,
    ];
    for (const square of notAttacked) {
      expect(isSquareAttacked(square, whiteAttackMask)).toBe(false);
    }

    const attacked = [
      1, 2, 3, 4, 5, 6, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
      24, 26, 28, 29, 30, 33, 35, 37, 38, 39, 40, 42, 44, 45, 46, 47, 51, 53,
    ];
    for (const square of attacked) {
      expect(isSquareAttacked(square, whiteAttackMask)).toBe(true);
    }
  });

  test("Black attacks", () => {
    const notAttacked = [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 20, 21, 22, 27, 29, 32,
      36, 38, 40, 50, 54,
    ];
    for (const square of notAttacked) {
      try {
        expect(isSquareAttacked(square, blackAttackMask)).toBe(false);
      } catch (e) {
        console.log(square);
        throw e;
      }
    }

    const attacked = [
      12, 14, 16, 18, 19, 23, 24, 25, 26, 28, 30, 31, 33, 34, 35, 37, 39, 41,
      42, 43, 44, 45, 46, 47, 48, 49, 51, 52, 53, 55, 56, 57, 58, 59, 60, 61,
      62, 63,
    ];
    for (const square of attacked) {
      try {
        expect(isSquareAttacked(square, blackAttackMask)).toBe(true);
      } catch (e) {
        console.log(square);
        throw e;
      }
    }
  });
});

describe("isInCheck", () => {
  test("white king not in check on empty board", () => {
    const bbs = emptyBitboards();
    // place just the white king on e1 (sq=4)
    placePiece(bbs, C.WHITE_KING, 4);
    computeAllAttackMasks(bbs);

    expect(isInCheck(bbs, C.WHITE)).toBe(false);
  });

  test("black king not in check on empty board", () => {
    const bbs = emptyBitboards();
    placePiece(bbs, C.BLACK_KING, 60); // e8
    computeAllAttackMasks(bbs);

    expect(isInCheck(bbs, C.BLACK)).toBe(false);
  });

  test("white king in check from black rook", () => {
    const bbs = emptyBitboards();
    // white king on e1 (4), black rook on e8 (60)
    placePiece(bbs, C.WHITE_KING, 4);
    placePiece(bbs, C.BLACK_ROOK, 60);
    computeAllAttackMasks(bbs);

    // we expect e1 attacked along file
    expect(isInCheck(bbs, C.WHITE)).toBe(true);
  });

  test("black king in check from white bishop", () => {
    const bbs = emptyBitboards();
    // black king on d5 (sq=27), white bishop on a2 (sq=9) — diagonal attack
    placePiece(bbs, C.BLACK_KING, 27);
    placePiece(bbs, C.WHITE_BISHOP, 9);
    computeAllAttackMasks(bbs);

    expect(isInCheck(bbs, C.BLACK)).toBe(true);
  });

  test("king not in check when blocked", () => {
    const bbs = emptyBitboards();
    // white king on e1 (4), black rook on e8 (60), but pawn blocking on e4 (sq=28)
    placePiece(bbs, C.WHITE_KING, 4);
    placePiece(bbs, C.BLACK_ROOK, 60);
    placePiece(bbs, C.BLACK_PAWN, 28);
    computeAllAttackMasks(bbs);

    expect(isInCheck(bbs, C.WHITE)).toBe(false);
  });

  test("double check detection", () => {
    const bbs = emptyBitboards();
    // white king on e1 (4)
    placePiece(bbs, C.WHITE_KING, 4);

    // two attackers: black queen on e8 (60) and black knight on g2 (sq=14)
    placePiece(bbs, C.BLACK_QUEEN, 60);
    placePiece(bbs, C.BLACK_KNIGHT, 14);
    computeAllAttackMasks(bbs);

    expect(isInCheck(bbs, C.WHITE)).toBe(true);
  });

  test("pawn check detection for Black king", () => {
    const bbs = emptyBitboards();
    // black king on e5 (sq=28)
    placePiece(bbs, C.BLACK_KING, 28);
    placePiece(bbs, C.WHITE_PAWN, 21);
    computeAllAttackMasks(bbs);

    expect(isInCheck(bbs, C.BLACK)).toBe(true);
  });
});

