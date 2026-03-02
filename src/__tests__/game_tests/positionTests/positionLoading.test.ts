import { describe, expect, test } from "vitest";
import { Position } from "../../../game/Position.ts";
import {
  EN_PASSANT_WHITE,
  KIWIPETE_POS,
  KNIGHT_FORK_POS,
  validateBitboards,
} from "../fens.ts";
import {
  BK,
  BLACK,
  BQ,
  COLUMN_INDEXES,
  isValidColChar,
  WHITE,
  WK,
  WQ,
} from "../../../game/chessConstants.ts";

describe("FEN position loading", () => {
  test("position validate", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    expect(pos.validate()).toBe(true);
  });

  test("bitboards are correct", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    expect(validateBitboards(pos.bitboards, KIWIPETE_POS)).toBe(true);
  });

  test("sideToMove is correct", () => {
    const pos = new Position();
    pos.loadFen(KIWIPETE_POS);

    const playerStr = KIWIPETE_POS.split(" ")[1];
    const correct = playerStr === "w" ? WHITE : BLACK;
    expect(pos.sideToMove).toBe(correct);
  });

  test("castling is correct", () => {
    const pos = new Position();
    pos.loadFen(KNIGHT_FORK_POS); // Black cant castle

    const castlingStr = KNIGHT_FORK_POS.split(" ")[2];
    const charToRights = {
      K: WK,
      Q: WQ,
      k: BK,
      q: BQ,
    };

    function isValidCastlingChar(c: string): c is keyof typeof charToRights {
      return c in charToRights;
    }
    for (const char of castlingStr) {
      if (!isValidCastlingChar(char))
        throw new Error(`Invalid castling char: ${char}`);
      expect(pos.castlingRights & charToRights[char]).not.toBe(0n);
    }
  });

  test("en passant is correct", () => {
    const pos = new Position();
    pos.loadFen(EN_PASSANT_WHITE);

    const epStr = EN_PASSANT_WHITE.split(" ")[3];

    const colChar = epStr[0];
    if (!isValidColChar(colChar)) throw new Error(`Invalid col ${colChar}`);

    const row = parseInt(epStr[1]) - 1; // Make row 0 indexed
    const col = COLUMN_INDEXES[colChar];
    const sq = row * 8 + col;

    expect(pos.enPassantSquare).toBe(sq);
  });

  test("move metadata is correct", () => {
    const pos = new Position();

    const halfmove = 12;
    const fullmove = 31;
    const split = KIWIPETE_POS.split(" ");
    split[4] = String(halfmove);
    split[5] = String(fullmove);

    pos.loadFen(split.join(" "));

    expect(pos.halfmoveClock).toBe(halfmove);
    expect(pos.fullmoveNumber).toBe(fullmove);
  });
});
