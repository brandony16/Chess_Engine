// getCheckers.test.ts
import { describe, it, expect } from "vitest";
import { Position } from "../../game/Position.ts";

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
    expect(pos.getCheckers()).toBe(0n);
  });

  it("detects a rook giving check", () => {
    // Black rook on e1, white king on e8 — white to move, rook on same file
    const pos = fromFen("4k3/8/8/8/8/8/8/4r3 w - - 0 1"); // wait, king on e8, rook on e1
    // Actually white king on e1 checked by black rook on e8
    const pos2 = fromFen("4r3/8/8/8/8/8/8/4K3 w - - 0 1");
    const checkers = pos2.getCheckers();
    expect(checkers).not.toBe(0n);
    // Only one checker
    expect(checkers & (checkers - 1n)).toBe(0n);
  });

  it("detects a queen giving check on a diagonal", () => {
    // Black queen on h5, white king on e2
    const pos = fromFen("8/8/8/7q/8/8/4K3/8 w - - 0 1");
    expect(pos.getCheckers()).not.toBe(0n);
  });

  it("detects a knight giving check", () => {
    // Black knight on f3, white king on e1
    const pos = fromFen("8/8/8/8/8/5n2/8/4K3 w - - 0 1");
    const checkers = pos.getCheckers();
    expect(checkers).not.toBe(0n);
    expect(checkers & (checkers - 1n)).toBe(0n); // exactly one
  });

  it("detects a pawn giving check", () => {
    // Black pawn on d2, white king on e1
    const pos = fromFen("8/8/8/8/8/8/3p4/4K3 w - - 0 1");
    expect(pos.getCheckers()).not.toBe(0n);
  });

  it("detects double check", () => {
    // Black rook on e8 and black bishop on b4 both check white king on e1
    const pos = fromFen("4r3/8/8/8/1b6/8/8/4K3 w - - 0 1");
    const checkers = pos.getCheckers();
    expect(checkers).not.toBe(0n);
    // moreThanOne — two bits set
    expect(checkers & (checkers - 1n)).not.toBe(0n);
  });

  it("piece on same file but blocked is not a checker", () => {
    // Black rook on e8, white pawn on e4 blocking, white king on e1
    const pos = fromFen("4r3/8/8/8/4P3/8/8/4K3 w - - 0 1");
    expect(pos.getCheckers()).toBe(0n);
  });

  it("works for black side to move", () => {
    // White rook on e1 checking black king on e8
    const pos = fromFen("4k3/8/8/8/8/8/8/4R3 b - - 0 1");
    expect(pos.getCheckers()).not.toBe(0n);
  });

  it("detects check from bishop on long diagonal", () => {
    // Black bishop on a6, white king on f1
    const pos = fromFen("8/8/b7/8/8/8/8/5K2 w - - 0 1");
    expect(pos.getCheckers()).not.toBe(0n);
  });

  it("bishop on same diagonal but blocked is not a checker", () => {
    // Black bishop on a6, white pawn on c4 blocking, white king on f1
    const pos = fromFen("8/8/b7/8/2P5/8/8/5K2 w - - 0 1");
    expect(pos.getCheckers()).toBe(0n);
  });
});

// ─── getPinnedPieces ──────────────────────────────────────────────────────────

describe("getPinnedPieces", () => {
  it("starting position has no pins", () => {
    const pos = fromFen(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    expect(pos.getPinnedPieces()).toBe(0n);
  });

  it("detects a piece pinned on a file", () => {
    // Black rook on e8, white rook on e4 (pinned), white king on e1
    const pos = fromFen("4r3/8/8/8/4R3/8/8/4K3 w - - 0 1");
    const pinned = pos.getPinnedPieces();
    expect(pinned).not.toBe(0n);
    // Only one pinned piece
    expect(pinned & (pinned - 1n)).toBe(0n);
  });

  it("detects a piece pinned on a rank", () => {
    // White king on e1, white knight on c1 pinned by black rook on a1
    const pos = fromFen("8/8/8/8/8/8/8/r1N1K3 w - - 0 1");
    const pinned = pos.getPinnedPieces();
    expect(pinned).not.toBe(0n);
  });

  it("detects a piece pinned on a diagonal", () => {
    // Black bishop on a6, white knight on c4 (pinned), white king on f1 (e2 diagonal)
    const pos = fromFen("8/8/b7/8/2N5/8/8/5K2 w - - 0 1");
    const pinned = pos.getPinnedPieces();
    expect(pinned).not.toBe(0n);
    expect(pinned & (pinned - 1n)).toBe(0n);
  });

  it("two pieces on same ray are not pinned", () => {
    // Black rook on e8, two white pieces on e-file, white king on e1
    // Neither is pinned because two pieces block the ray
    const pos = fromFen("4r3/8/8/8/4R3/4N3/8/4K3 w - - 0 1");
    expect(pos.getPinnedPieces()).toBe(0n);
  });

  it("enemy piece on ray between king and slider is not a pin", () => {
    // Black rook on e8, black pawn on e5, white king on e1 — no friendly piece pinned
    const pos = fromFen("4r3/8/8/4p3/8/8/8/4K3 w - - 0 1");
    expect(pos.getPinnedPieces()).toBe(0n);
  });

  it("detects multiple pins simultaneously", () => {
    // Black rook on e8 pins white rook on e4
    // Black bishop on a6 pins white knight on c4
    // White king on e2
    const pos = fromFen("4r3/8/b7/8/2N1R3/8/4K3/8 w - - 0 1");
    const pinned = pos.getPinnedPieces();
    expect(pinned).not.toBe(0n);
    // Two pinned pieces — more than one bit set
    expect(pinned & (pinned - 1n)).not.toBe(0n);
  });

  it("works for black side to move", () => {
    // White rook on e1, black rook on e5 pinned, black king on e8
    const pos = fromFen("4k3/8/8/4r3/8/8/8/4R3 b - - 0 1");
    const pinned = pos.getPinnedPieces();
    expect(pinned).not.toBe(0n);
  });

  it("queen as pinner on diagonal", () => {
    // White queen on a6, black bishop on c4 pinned, black king on f1
    // Wait — black to move: white queen on h5, black knight on f3, black king on e1 (not valid for black king on e1)
    // Black king on e8, black knight on f7 pinned by white queen on g6
    const pos = fromFen("4k3/5n2/6Q1/8/8/8/8/8 b - - 0 1");
    const pinned = pos.getPinnedPieces();
    expect(pinned).not.toBe(0n);
  });
});
