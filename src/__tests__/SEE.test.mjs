import {
  BLACK_BISHOP,
  BLACK_PAWN,
  WHITE,
  WHITE_KNIGHT,
  WHITE_PAWN,
  WHITE_ROOK,
} from "../coreLogic/constants.mjs";
import { SEE } from "../coreLogic/engines/BMV7/SEE.mjs";
import { getFENData } from "../coreLogic/helpers/FENandUCIHelpers.mjs";
import {
  getAllPieces,
  initializePieceAtArray,
} from "../coreLogic/pieceGetters.mjs";
import { initializePieceIndicies } from "../coreLogic/pieceIndicies.mjs";
import { computeAllAttackMasks } from "../coreLogic/PieceMasks/individualAttackMasks.mjs";

describe("SEE", () => {
  it("should calculate a single move sequence", () => {
    const fen = "1k1r4/1pp4p/p7/4p3/8/P5P1/1PP4P/2K1R3 w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const targetSq = 36; // Pawn on e5
    const targetPiece = BLACK_PAWN;
    const fromSq = 4; // White rook on e1
    const movingPiece = WHITE_ROOK;
    const result = SEE(
      bitboards,
      targetPiece,
      fromSq,
      targetSq,
      movingPiece,
      WHITE
    );

    expect(result).toBe(100);
  });

  it("should calculate a move complex move sequence", () => {
    const fen = "1k1r3q/1ppn3p/p4b2/4p3/8/P2N2P1/1PP1R1BP/2K1Q3 w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const targetSq = 36; // Pawn on e5
    const targetPiece = BLACK_PAWN;
    const fromSq = 19; // White knight on d3
    const movingPiece = WHITE_KNIGHT;
    const result = SEE(
      bitboards,
      targetPiece,
      fromSq,
      targetSq,
      movingPiece,
      WHITE
    );

    expect(result).toBe(-220);
  });

  it("should calculate a move sequence with pinned pieces", () => {
    // Slightly tweaked position from previous test case
    const fen = "1k1r3q/1pp4p/p4b2/4p3/8/P2N2P1/1PP1R1BP/2K4Q w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const targetSq = 36; // Pawn on e5
    const targetPiece = BLACK_PAWN;
    const fromSq = 19; // White knight on d3
    const movingPiece = WHITE_KNIGHT;
    const result = SEE(
      bitboards,
      targetPiece,
      fromSq,
      targetSq,
      movingPiece,
      WHITE
    );

    expect(result).toBe(-220);
  });

  it("should calculate a move sequence correctly with black", () => {
    const fen = "1k2r2q/1pp3bp/p7/4P3/8/P2N2P1/1PP1R1BP/2K4Q w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const targetSq = 36; // Pawn on e5
    const targetPiece = WHITE_PAWN;
    const fromSq = 54; // Black bishop on g7
    const movingPiece = BLACK_BISHOP;
    const result = SEE(
      bitboards,
      targetPiece,
      fromSq,
      targetSq,
      movingPiece,
      WHITE
    );

    expect(result).toBe(100);
  });
});
