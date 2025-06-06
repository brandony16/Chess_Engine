import {
  bitboardsToFEN,
  getFENData,
  uciToMove,
} from "../components/bitboardUtils/FENandUCIHelpers";
import {
  makeMove,
  unMakeMove,
} from "../components/bitboardUtils/moveMaking/makeMoveLogic";
import * as C from "../components/bitboardUtils/constants";
import {
  initializePieceAtArray,
  pieceAt,
} from "../components/bitboardUtils/pieceGetters";
import { computeAllAttackMasks } from "../components/bitboardUtils/PieceMasks/individualAttackMasks";
import {
  indexArrays,
  initializePieceIndicies,
} from "../components/bitboardUtils/pieceIndicies";

// [ description, FEN, UCI move ]
const cases = [
  [
    "Pawn advance",
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    "e2e4",
  ],
  ["Simple capture", "k7/8/8/3p4/4P3/8/8/4K3 w - - 0 1", "e4d5"],
  ["Kingside castle", "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1g1"],
  ["Queenside castle", "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1c1"],
  ["En passant", "k7/8/8/3pP3/8/8/8/4K3 w - d6 0 1", "e5d6"],
  ["Promotion Queen", "4k3/1pP5/8/8/8/8/8/4K3 w - - 0 1", "c7c8q"],
  ["Promotion Knight", "4k3/1pP5/8/8/8/8/8/4K3 w - - 0 1", "c7c8n"],
  ["Knight hop", "k7/8/8/8/8/8/N7/4K3 w - - 0 1", "a2b4"],
];

describe("makeMove + unMakeMove", () => {
  test.each(cases)(
    "%s should return to the original FEN, pieceAt, and pieceIndicies",
    (_desc, fen, uci) => {
      const fenData = getFENData(fen);
      const bitboards = fenData.bitboards;
      const player = fenData.player;
      const castling = fenData.castling;
      const ep = fenData.ep;

      computeAllAttackMasks(bitboards);
      initializePieceAtArray(bitboards);
      initializePieceIndicies(bitboards);
      const move = uciToMove(uci, bitboards, player, castling, ep);

      const beforeMovePieceAt = structuredClone(pieceAt);
      const beforeMoveIndicies = structuredClone(indexArrays);
      makeMove(bitboards, move);

      // Check that pieceAt is updated correctly
      const afterMovePieceAt = structuredClone(pieceAt);
      initializePieceAtArray(bitboards);
      expect(afterMovePieceAt).toEqual(pieceAt);
      expect(beforeMovePieceAt).not.toEqual(pieceAt);

      // Check that indexArrays are updated correctly
      const afterMoveIndicies = structuredClone(indexArrays);
      initializePieceIndicies(bitboards);
      expect(areIndexArraysEqual(afterMoveIndicies, indexArrays)).toBe(true);
      expect(areIndexArraysEqual(beforeMoveIndicies, indexArrays)).toBe(false);

      unMakeMove(move, bitboards);
      expect(beforeMovePieceAt).toEqual(pieceAt);
      expect(areIndexArraysEqual(beforeMoveIndicies, indexArrays)).toBe(true);

      const fenAfter = bitboardsToFEN(bitboards, player, castling, ep);
      expect(fenAfter).toBe(fen);
    }
  );
});

describe("makeMove bitboard updates", () => {
  test("simple pawn advance (e2→e4)", () => {
    const bitboards = new BigUint64Array(12);
    // set a white pawn on e2: file=e(4), rank=2(1) → index = 8*1 + 4 = 12
    bitboards[C.WHITE_PAWN] = 1n << 12n;

    const move = {
      from: 12,
      to: 28, // e2→e4: 8*3 + 4 = 28
      piece: C.WHITE_PAWN,
      captured: null,
      promotion: null,
      enPassant: false,
      castling: false,
    };
    initializePieceAtArray(bitboards);

    makeMove(bitboards, move);

    // expect pawn gone from e2, now on e4
    expect(bitboards[C.WHITE_PAWN]).toBe(1n << 28n);
  });

  test("simple capture (e4→d5 capturing pawn)", () => {
    const bitboards = new BigUint64Array(12);
    bitboards[C.WHITE_PAWN] = 1n << 28n; // white pawn on e4
    bitboards[C.BLACK_PAWN] = 1n << 27n; // black pawn on d5

    const move = {
      from: 28,
      to: 27, // e4→d5
      piece: C.WHITE_PAWN,
      captured: C.BLACK_PAWN,
      promotion: null,
      enPassant: false,
      castling: false,
    };

    makeMove(bitboards, move);

    // pawn has moved, capture removed
    expect(bitboards[C.WHITE_PAWN]).toBe(1n << 27n);
    expect(bitboards[C.BLACK_PAWN]).toBe(0n);
  });

  test("promotion to queen (c7→c8=Q)", () => {
    const bitboards = new BigUint64Array(12);
    // white pawn on c7: file=c(2), rank=7(6) → index = 8*6 + 2 = 50
    bitboards[C.WHITE_PAWN] = 1n << 50n;

    const move = {
      from: 50,
      to: 58, // c7→c8: 8*7 + 2 = 58
      piece: C.WHITE_PAWN,
      captured: null,
      promotion: C.WHITE_QUEEN,
      enPassant: false,
      castling: false,
    };

    makeMove(bitboards, move);

    // pawn removed, queen added
    expect(bitboards[C.WHITE_PAWN]).toBe(0n);
    expect(bitboards[C.WHITE_QUEEN]).toBe(1n << 58n);
  });

  test("underpromotion to knight (c7→c8=N)", () => {
    const bitboards = new BigUint64Array(12);
    bitboards[C.WHITE_PAWN] = 1n << 50n; // pawn on c7

    const move = {
      from: 50,
      to: 58,
      piece: C.WHITE_PAWN,
      captured: null,
      promotion: C.WHITE_KNIGHT,
      enPassant: false,
      castling: false,
    };

    makeMove(bitboards, move);

    expect(bitboards[C.WHITE_PAWN]).toBe(0n);
    expect(bitboards[C.WHITE_KNIGHT]).toBe(1n << 58n);
  });

  test("en passant capture (e5→d6)", () => {
    const bitboards = new BigUint64Array(12);
    // white pawn on e5: index = 8*4 + 4 = 36
    // black pawn on d5: index = 8*4 + 3 = 35
    bitboards[C.WHITE_PAWN] = 1n << 36n;
    bitboards[C.BLACK_PAWN] = 1n << 35n;

    const move = {
      from: 36,
      to: 43, // e5→d6: 8*5 + 3 = 43
      piece: C.WHITE_PAWN,
      captured: C.BLACK_PAWN,
      promotion: null,
      enPassant: true,
      castling: false,
    };

    makeMove(bitboards, move);

    // pawn moves, captured pawn (on d5) removed
    expect(bitboards[C.WHITE_PAWN]).toBe(1n << 43n);
    expect(bitboards[C.BLACK_PAWN]).toBe(0n);
  });
});

function areIndexArraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    const indexes1 = arr1[i].sort();
    const indexes2 = arr2[i].sort();
    if (indexes1.length !== indexes2.length) return false;

    for (let j = 0; j < indexes1.length; j++) {
      if (indexes1[j] !== indexes2[j]) {
        return false;
      }
    }
  }
  return true;
}
