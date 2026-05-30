import { describe, expect, it, test } from "vitest";
import { MAX_MOVES, Position } from "../../game/Position.ts";
import { encodeMove, type Move } from "../../game/moveMaking/move.ts";
import { BLACK_PAWN, sq, WHITE_PAWN } from "../../game/chessConstants.ts";
import { lsb, moreThanOne } from "../../game/bb.ts";
import type { L } from "vitest/dist/chunks/reporters.d.BFLkQcL6.js";
import { zobristTableLo } from "../../game/positionStates/zobrist.ts";
import { uciToMove } from "../../game/fenAndUCI/uciHelpers.ts";
import { KIWIPETE_POS, PROMOTION_ENDGAME } from "./fens.ts";

describe("zobrist keys are consistent", () => {
  test("zobrist keys are deterministic", () => {
    const pos1 = new Position();
    const pos2 = new Position();

    expect(pos1.zobristLo).toBe(pos2.zobristLo);
    expect(pos1.zobristHi).toBe(pos2.zobristHi);

    // Make and unmake moves - key should return to original
    const keyLo = pos1.zobristLo,
      keyHi = pos1.zobristHi;
    const move = encodeMove(sq.E2, sq.E4, WHITE_PAWN);
    pos1.makeMove(move);
    pos1.unmakeMove();

    expect(pos1.zobristLo).toBe(keyLo);
    expect(pos1.zobristHi).toBe(keyHi);
  });

  test("zobrist keys change on moves", () => {
    const pos = new Position();
    const key1Lo = pos.zobristLo,
      key1Hi = pos.zobristHi;

    const move = encodeMove(sq.E2, sq.E4, WHITE_PAWN);
    pos.makeMove(move);
    const key2Lo = pos.zobristLo,
      key2Hi = pos.zobristHi;

    expect(key1Lo).not.toBe(key2Lo);
    expect(key1Hi).not.toBe(key2Hi);
    pos.unmakeMove();

    // Different move should give different key
    const move2 = encodeMove(sq.D2, sq.D4, WHITE_PAWN);
    pos.makeMove(move2);

    expect(pos.zobristLo).not.toBe(key1Lo);
    expect(pos.zobristLo).not.toBe(key2Lo);
    expect(pos.zobristHi).not.toBe(key1Hi);
    expect(pos.zobristHi).not.toBe(key2Hi);
  });

  test("zobrist incremental vs from-scratch match", () => {
    const pos = new Position();

    // Make 10 random moves
    const moves = [];
    for (let i = 0; i < 10; i++) {
      const legalMoves = getLegalMoves(pos);
      const move = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      moves.push(move);
      pos.makeMove(move);
    }

    const incrementalLo = pos.zobristLo;
    const incrementalHi = pos.zobristHi;

    // Rebuild from FEN
    const fen = pos.getFen();
    pos.loadFen(fen);

    expect(pos.zobristLo).toBe(incrementalLo);
    expect(pos.zobristHi).toBe(incrementalHi);
  });

  function getLegalMoves(pos: Position): Move[] {
    const count = pos.generatePseudoLegalMoves();
    const checkers = pos.getCheckers();
    const pinned = pos.getPinnedPieces();
    const doubleCheck = moreThanOne(checkers[0], checkers[1]);

    const start = pos.searchPly * MAX_MOVES;
    const legal: Move[] = [];
    for (let i = 0; i < count; i++) {
      const move = pos.moveBuffer[start + i];

      if (!pos.isLegal(move, checkers, pinned, doubleCheck)) continue;

      legal.push(move);
    }

    return legal;
  }
});

const computePawnZobrist = (pos: Position) => {
  let key = 0;

  let wPawnLo = pos.bbsLo[WHITE_PAWN];
  while (wPawnLo) {
    const sq = lsb(wPawnLo, 0);
    wPawnLo &= wPawnLo - 1;

    const idx = WHITE_PAWN * 64 + sq;
    key ^= zobristTableLo[idx];
  }

  let wPawnHi = pos.bbsHi[WHITE_PAWN];
  while (wPawnHi) {
    const sq = lsb(0, wPawnHi);
    wPawnHi &= wPawnHi - 1;

    const idx = WHITE_PAWN * 64 + sq;
    key ^= zobristTableLo[idx];
  }

  let bPawnLo = pos.bbsLo[BLACK_PAWN];
  while (bPawnLo) {
    const sq = lsb(bPawnLo, 0);
    bPawnLo &= bPawnLo - 1;

    const idx = BLACK_PAWN * 64 + sq;
    key ^= zobristTableLo[idx];
  }

  let bPawnHi = pos.bbsHi[BLACK_PAWN];
  while (bPawnHi) {
    const sq = lsb(0, bPawnHi);
    bPawnHi &= bPawnHi - 1;

    const idx = BLACK_PAWN * 64 + sq;
    key ^= zobristTableLo[idx];
  }

  return key;
};

describe("pawn zobrist keys are accurate", () => {
  it("is accurate on initialization", () => {
    const pos = new Position();

    expect(pos.pawnZobrist).toBe(computePawnZobrist(pos));
  });

  it("is accurate after making a move", () => {
    const pos = new Position();

    const move = uciToMove("e2e4", pos);
    pos.makeMove(move);

    expect(pos.pawnZobrist).toBe(computePawnZobrist(pos));
  });

  it("is accurate after unmaking a move", () => {
    const pos = new Position();

    const move = uciToMove("e2e4", pos);
    pos.makeMove(move);
    pos.unmakeMove();

    expect(pos.pawnZobrist).toBe(computePawnZobrist(pos));
  });

  it("is accurate after capturing a pawn", () => {
    const pos = new Position(KIWIPETE_POS);

    const move = uciToMove("d5e6", pos);
    pos.makeMove(move);

    expect(pos.pawnZobrist).toBe(computePawnZobrist(pos));

    pos.unmakeMove();

    expect(pos.pawnZobrist).toBe(computePawnZobrist(pos));
  });

  it("is accurate after promoting a pawn", () => {
    const pos = new Position(PROMOTION_ENDGAME);

    const move = uciToMove("c7d8q", pos);
    pos.makeMove(move);

    expect(pos.pawnZobrist).toBe(computePawnZobrist(pos));

    const blackMove = uciToMove("g2f1q", pos);
    pos.makeMove(blackMove);

    expect(pos.pawnZobrist).toBe(computePawnZobrist(pos));

    pos.unmakeMove();
    expect(pos.pawnZobrist).toBe(computePawnZobrist(pos));

    pos.unmakeMove();
    expect(pos.pawnZobrist).toBe(computePawnZobrist(pos));
  });
});
