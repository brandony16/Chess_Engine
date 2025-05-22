import { getAllPieces } from "../components/bitboardUtils/pieceGetters";
import {
  attacksOf,
  computeMaskForPiece,
} from "../components/bitboardUtils/PieceMasks/individualAttackMasks";

// Helper to build an empty 12‐entry piece array
function emptyBitboards() {
  return new BigUint64Array(12).fill(0n);
}

describe("computeMaskForPiece", () => {
  test("rook on a1 on empty board", () => {
    const bitboards = emptyBitboards();
    const ROOK = 3; // White rook
    // place rook on a1 (square 0)
    bitboards[ROOK] = 1n << 0n;

    // Precomputed mask for a1‐rook on empty board:
    // file A: 0x0101010101010101
    // rank 1: 0x00000000000000FF
    // 0x0101010101010101 + 0xFF = 0x01010101010101FF
    const expected = 0x01010101010101ffn - 1n;

    const mask = computeMaskForPiece(bitboards, ROOK);

    expect(mask).toBe(expected);
  });

  test("knight on b1 on empty board", () => {
    const bitboards = emptyBitboards();
    const KNIGHT = 1; // assume index 1 is white knight
    // place knight on b1 (square 1)
    bitboards[KNIGHT] = 1n << 1n;

    // Knight‐moves from b1: a3 (square 16), c3 (18), d2 (11)
    // Mask = (1<<16) + (1<<18) + (1<<11) = 0x10000 + 0x40000 + 0x800 = 0x50800
    const expected = 0x50800n;

    const mask = computeMaskForPiece(bitboards, KNIGHT);
    expect(mask).toBe(expected);
  });

  test("queen on d4 with a single blocker", () => {
    const bitboards = emptyBitboards();
    const QUEEN = 4;
    // place queen on d4
    bitboards[QUEEN] = 1n << 27n;
    const BLOCKER_PIECE = 0; // White pawn blocker
    // place a blocker at f6 (blocks diagonal)
    bitboards[BLOCKER_PIECE] = 1n << 45n;

    const occ = getAllPieces(bitboards);
    let expected = 0n;

    expected |= attacksOf(occ, QUEEN, 27);

    const mask = computeMaskForPiece(bitboards, QUEEN);
    expect(mask).toBe(expected);
  });

  test("multiple pieces of same type", () => {
    const bitboards = emptyBitboards();
    const BISHOP = 3;
    // bishops on c1 (2) and f4 (29)
    bitboards[BISHOP] = (1n << 2n) | (1n << 29n);

    // no other pieces → occupancy = those two
    const occ = getAllPieces(bitboards);

    // sum both attack sets
    let expected = 0n;
    expected |= attacksOf(occ, BISHOP, 2);
    expected |= attacksOf(occ, BISHOP, 29);

    const mask = computeMaskForPiece(bitboards, BISHOP);
    expect(mask).toBe(expected);
  });
});
