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
  FILE_INDEXES,
  FILE_SYMBOLS,
  isValidFileChar,
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

    expect(validateBitboards(pos.bbsLo, pos.bbsHi, KIWIPETE_POS)).toBe(true);
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

    const fileChar = epStr[0];
    console.log(fileChar === FILE_SYMBOLS[3])
    if (!isValidFileChar(fileChar)) throw new Error(`Invalid file: ${fileChar}`);

    const rank = parseInt(epStr[1]) - 1; // Make row 0 indexed
    const file = FILE_INDEXES[fileChar];
    const sq = rank * 8 + file;

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
