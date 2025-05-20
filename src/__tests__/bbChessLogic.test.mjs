import { isSquareAttacked } from "../components/bitboardUtils/bbChessLogic";
import * as C from "../components/bitboardUtils/constants";
import { getFENData } from "../components/bitboardUtils/FENandUCIHelpers";
import { getAttackMask } from "../components/bitboardUtils/PieceMasks/attackMask";
import { computeAllAttackMasks } from "../components/bitboardUtils/PieceMasks/individualAttackMasks";

describe("isSquareAttacked", () => {
  const kiwipeteFEN =
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
  const fenData = getFENData(kiwipeteFEN);
  const bitboards = fenData.bitboards;
  const player = fenData.player;
  const castling = fenData.castling;
  const ep = fenData.ep;

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
