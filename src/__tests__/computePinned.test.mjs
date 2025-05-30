import { jest } from "@jest/globals";
import { getFENData } from "../components/bitboardUtils/FENandUCIHelpers";
import { computePinned } from "../components/bitboardUtils/moveGeneration/computePinned";
import * as C from "../components/bitboardUtils/constants";
import { bitScanForward } from "../components/bitboardUtils/bbUtils";

describe("computePinned", () => {
  it("should be 0 when there are no pinned pieces", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const wKingSq = bitScanForward(bitboards[C.WHITE_KING]);
    const bKingSq = bitScanForward(bitboards[C.BLACK_KING]);

    expect(computePinned(bitboards, C.WHITE, wKingSq)).toBe(0n);
    expect(computePinned(bitboards, C.BLACK, bKingSq)).toBe(0n);
  });

  it("detects piece pinned by a rook", () => {
    const fen = "3kq2R/8/8/8/1r1N1K2/8/8/8 w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const wKingSq = bitScanForward(bitboards[C.WHITE_KING]);
    const bKingSq = bitScanForward(bitboards[C.BLACK_KING]);

    expect(computePinned(bitboards, C.WHITE, wKingSq)).toBe(1n << BigInt(27));
    expect(computePinned(bitboards, C.BLACK, bKingSq)).toBe(1n << BigInt(60));
  });

  it("detects piece pinned by a bishop", () => {
    const fen = "3k4/2q5/8/B2b4/8/8/6N1/7K w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const wKingSq = bitScanForward(bitboards[C.WHITE_KING]);
    const bKingSq = bitScanForward(bitboards[C.BLACK_KING]);

    expect(computePinned(bitboards, C.WHITE, wKingSq)).toBe(1n << BigInt(14));
    expect(computePinned(bitboards, C.BLACK, bKingSq)).toBe(1n << BigInt(50));
  });

  it("detects piece pinned by a queen (orthogonal)", () => {
    const fen = "3k4/3p4/8/3Q4/8/8/8/q5RK w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const wKingSq = bitScanForward(bitboards[C.WHITE_KING]);
    const bKingSq = bitScanForward(bitboards[C.BLACK_KING]);

    expect(computePinned(bitboards, C.WHITE, wKingSq)).toBe(1n << BigInt(6));
    expect(computePinned(bitboards, C.BLACK, bKingSq)).toBe(1n << BigInt(51));
  });

  it("detects piece pinned by a queen (diagonal)", () => {
    const fen = "8/6K1/1k3R2/2p5/8/2q5/8/6Q1 w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const wKingSq = bitScanForward(bitboards[C.WHITE_KING]);
    const bKingSq = bitScanForward(bitboards[C.BLACK_KING]);

    expect(computePinned(bitboards, C.WHITE, wKingSq)).toBe(1n << BigInt(45));
    expect(computePinned(bitboards, C.BLACK, bKingSq)).toBe(1n << BigInt(34));
  });

  it("ignores pieces that are blocked by another enemy peice", () => {
    const fen = "8/8/1k6/q1p5/1n6/4N3/3P1B2/4K3 w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const wKingSq = bitScanForward(bitboards[C.WHITE_KING]);
    const bKingSq = bitScanForward(bitboards[C.BLACK_KING]);

    expect(computePinned(bitboards, C.WHITE, wKingSq)).toBe(0n);
    expect(computePinned(bitboards, C.BLACK, bKingSq)).toBe(0n);
  });

  it("ignores pieces that are blocked by two friendly peices", () => {
    const fen = "4k3/3r4/2q5/1B2r3/8/4N3/4P3/4K3 w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const wKingSq = bitScanForward(bitboards[C.WHITE_KING]);
    const bKingSq = bitScanForward(bitboards[C.BLACK_KING]);

    expect(computePinned(bitboards, C.WHITE, wKingSq)).toBe(0n);
    expect(computePinned(bitboards, C.BLACK, bKingSq)).toBe(0n);
  });

  it("ignores pieces that not along a straight line to the king", () => {
    const fen = "1rkr4/1ppp2R1/5Q2/4Br1b/1Q1R4/3r3q/r2PPP1r/3NKN2 w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const wKingSq = bitScanForward(bitboards[C.WHITE_KING]);
    const bKingSq = bitScanForward(bitboards[C.BLACK_KING]);

    expect(computePinned(bitboards, C.WHITE, wKingSq)).toBe(0n);
    expect(computePinned(bitboards, C.BLACK, bKingSq)).toBe(0n);
  });
});
