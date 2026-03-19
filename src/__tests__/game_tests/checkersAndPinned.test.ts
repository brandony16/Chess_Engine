import { describe, it, expect } from "vitest";
import { Position } from "../../game/Position.ts";
import { bbIsEmpty, exactlyOne, moreThanOne } from "../../game/bb.ts";

// Helper — build a position from a FEN string
function fromFen(fen: string): Position {
  const pos = new Position();
  pos.loadFen(fen);
  return pos;
}

// ─── getCheckers ──────────────────────────────────────────────────────────────

describe("getCheckers", () => {
  it("starting position has no checkers", () => {
    const pos = fromFen(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    const [lo, hi] = pos.getCheckers();
    expect(bbIsEmpty(lo, hi)).toBe(true);
  });

  it("detects a rook giving check", () => {
    // white king on e1 checked by black rook on e8
    const pos2 = fromFen("4r3/8/8/8/8/8/8/4K3 w - - 0 1");
    const [lo, hi] = pos2.getCheckers();
    expect(bbIsEmpty(lo, hi)).toBe(false);
    // Only one checker
    expect(exactlyOne(lo, hi)).toBe(true);
  });

  it("detects a queen giving check on a diagonal", () => {
    // Black queen on h5, white king on e2
    const pos = fromFen("8/8/8/7q/8/8/4K3/8 w - - 0 1");
    const [lo, hi] = pos.getCheckers();
    expect(bbIsEmpty(lo, hi)).toBe(false);
  });

  it("detects a knight giving check", () => {
    // Black knight on f3, white king on e1
    const pos = fromFen("8/8/8/8/8/5n2/8/4K3 w - - 0 1");
    const [lo, hi] = pos.getCheckers();
    expect(bbIsEmpty(lo, hi)).toBe(false);
    // Only one checker
    expect(exactlyOne(lo, hi)).toBe(true);
  });

  it("detects a pawn giving check", () => {
    // Black pawn on d2, white king on e1
    const pos = fromFen("8/8/8/8/8/8/3p4/4K3 w - - 0 1");
    const [lo, hi] = pos.getCheckers();
    expect(bbIsEmpty(lo, hi)).toBe(false);
  });

  it("detects double check", () => {
    // Black rook on e8 and black bishop on b4 both check white king on e1
    const pos = fromFen("4r3/8/8/8/1b6/8/8/4K3 w - - 0 1");
    const [lo, hi] = pos.getCheckers();
    expect(bbIsEmpty(lo, hi)).toBe(false);
    // Only one checker
    expect(moreThanOne(lo, hi)).toBe(true);
  });

  it("piece on same file but blocked is not a checker", () => {
    // Black rook on e8, white pawn on e4 blocking, white king on e1
    const pos = fromFen("4r3/8/8/8/4P3/8/8/4K3 w - - 0 1");
    const [lo, hi] = pos.getCheckers();
    expect(bbIsEmpty(lo, hi)).toBe(true);
  });

  it("works for black side to move", () => {
    // White rook on e1 checking black king on e8
    const pos = fromFen("4k3/8/8/8/8/8/8/4R3 b - - 0 1");
    const [lo, hi] = pos.getCheckers();
    expect(bbIsEmpty(lo, hi)).toBe(false);
  });

  it("detects check from bishop on long diagonal", () => {
    // Black bishop on a6, white king on f1
    const pos = fromFen("8/8/b7/8/8/8/8/5K2 w - - 0 1");
    const [lo, hi] = pos.getCheckers();
    expect(bbIsEmpty(lo, hi)).toBe(false);
  });

  it("bishop on same diagonal but blocked is not a checker", () => {
    // Black bishop on a6, white pawn on c4 blocking, white king on f1
    const pos = fromFen("8/8/b7/8/2P5/8/8/5K2 w - - 0 1");
    const [lo, hi] = pos.getCheckers();
    expect(bbIsEmpty(lo, hi)).toBe(true);
  });
});

// ─── getPinnedPieces ──────────────────────────────────────────────────────────

describe("getPinnedPieces", () => {
  it("starting position has no pins", () => {
    const pos = fromFen(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    const [lo, hi] = pos.getPinnedPieces();
    expect(bbIsEmpty(lo, hi)).toBe(true);
  });

  it("detects a piece pinned on a file", () => {
    // Black rook on e8, white rook on e4 (pinned), white king on e1
    const pos = fromFen("4r3/8/8/8/4R3/8/8/4K3 w - - 0 1");
    const [lo, hi] = pos.getPinnedPieces();
    expect(bbIsEmpty(lo, hi)).toBe(false);
    // Only one pinned piece
    expect(exactlyOne(lo, hi)).toBe(true);
  });

  it("detects a piece pinned on a rank", () => {
    // White king on e1, white knight on c1 pinned by black rook on a1
    const pos = fromFen("8/8/8/8/8/8/8/r1N1K3 w - - 0 1");
    const [lo, hi] = pos.getPinnedPieces();
    expect(bbIsEmpty(lo, hi)).toBe(false);
    // Only one pinned piece
    expect(exactlyOne(lo, hi)).toBe(true);
  });

  it("detects a piece pinned on a diagonal", () => {
    // Black bishop on a6, white knight on c4 (pinned), white king on f1 (e2 diagonal)
    const pos = fromFen("8/8/b7/8/2N5/8/8/5K2 w - - 0 1");
    const [lo, hi] = pos.getPinnedPieces();
    expect(bbIsEmpty(lo, hi)).toBe(false);
    // Only one pinned piece
    expect(exactlyOne(lo, hi)).toBe(true);
  });

  it("two pieces on same ray are not pinned", () => {
    // Black rook on e8, two white pieces on e-file, white king on e1
    // Neither is pinned because two pieces block the ray
    const pos = fromFen("4r3/8/8/8/4R3/4N3/8/4K3 w - - 0 1");
    const [lo, hi] = pos.getPinnedPieces();
    expect(bbIsEmpty(lo, hi)).toBe(true);
  });

  it("enemy piece on ray between king and slider is not a pin", () => {
    // Black rook on e8, black pawn on e5, white king on e1 — no friendly piece pinned
    const pos = fromFen("4r3/8/8/4p3/8/8/8/4K3 w - - 0 1");
    const [lo, hi] = pos.getPinnedPieces();
    expect(bbIsEmpty(lo, hi)).toBe(true);
  });

  it("detects multiple pins simultaneously", () => {
    // Black rook on e8 pins white rook on e4
    // Black bishop on a6 pins white knight on c4
    // White king on e2
    const pos = fromFen("4r3/8/b7/8/2N1R3/8/4K3/8 w - - 0 1");
    const [lo, hi] = pos.getPinnedPieces();
    expect(bbIsEmpty(lo, hi)).toBe(false);
    // Two pinned pieces
    expect(moreThanOne(lo, hi)).toBe(true);
  });

  it("works for black side to move", () => {
    // White rook on e1, black rook on e5 pinned, black king on e8
    const pos = fromFen("4k3/8/8/4r3/8/8/8/4R3 b - - 0 1");
    const [lo, hi] = pos.getPinnedPieces();
    expect(bbIsEmpty(lo, hi)).toBe(false);
    expect(exactlyOne(lo, hi)).toBe(true);
  });

  it("queen as pinner on diagonal", () => {
    // Black king on e8, black knight on f7 pinned by white queen on g6
    const pos = fromFen("4k3/5n2/6Q1/8/8/8/8/8 b - - 0 1");
    const [lo, hi] = pos.getPinnedPieces();
    expect(bbIsEmpty(lo, hi)).toBe(false);
    expect(exactlyOne(lo, hi)).toBe(true);
  });
});
