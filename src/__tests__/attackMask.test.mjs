import {
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_KNIGHT,
  BLACK_PAWN,
  BLACK_QUEEN,
  BLACK_ROOK,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_PAWN,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../components/bitboardUtils/constants.mjs";
import { bigIntFullRep } from "../components/bitboardUtils/debugFunctions.mjs";
import { getFENData } from "../components/bitboardUtils/FENandUCIHelpers.mjs";
import {
  makeMove,
  unMakeMove,
} from "../components/bitboardUtils/moveMaking/makeMoveLogic.mjs";
import Move from "../components/bitboardUtils/moveMaking/move.mjs";
import { initializePieceAtArray } from "../components/bitboardUtils/pieceGetters.mjs";
import { initializePieceIndicies } from "../components/bitboardUtils/pieceIndicies.mjs";
import {
  computeAllAttackMasks,
  individualAttackMasks,
} from "../components/bitboardUtils/PieceMasks/individualAttackMasks.mjs";

describe("updateAttackMasks vs full recompute", () => {
  let bitboards;

  // Set up a base position for the tests
  beforeEach(() => {
    const fen =
      "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
    const fenData = getFENData(fen);
    bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    initializePieceAtArray(bitboards);
    computeAllAttackMasks(bitboards);
  });

  test("non-sliding move white", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(4, 5, WHITE_KING, null, null, false, false);
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });

  test("non-sliding move black", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(60, 61, BLACK_KING, null, null, false, false);
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });

  test("non-sliding capture white", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(35, 44, WHITE_PAWN, BLACK_PAWN, null, false, false);
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });

  test("non-sliding capture black", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(45, 28, BLACK_KNIGHT, WHITE_PAWN, null, false, false);
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });

  test("sliding rook move white", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();
    const move = new Move(7, 5, WHITE_ROOK, null, null, false, false);
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });

  test("sliding rook move black", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(56, 59, BLACK_ROOK, null, null, false, false);
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });

  test("sliding bishop move white", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(12, 33, WHITE_BISHOP, null, null, false, false);
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });

  test("sliding bishop move black", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(40, 19, BLACK_BISHOP, null, null, false, false);
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });

  test("sliding bishop capture white", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(
      12,
      40,
      WHITE_BISHOP,
      BLACK_BISHOP,
      null,
      false,
      false
    );
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });

  test("sliding bishop capture black", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(
      40,
      12,
      BLACK_BISHOP,
      WHITE_BISHOP,
      null,
      false,
      false
    );
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });

  test("sliding queen move white", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(21, 39, WHITE_QUEEN, null, null, false, false);
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });

  test("sliding queen move black", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(52, 59, BLACK_QUEEN, null, null, false, false);
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });

  test("sliding queen capture white", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(
      21,
      45,
      WHITE_QUEEN,
      BLACK_KNIGHT,
      null,
      false,
      false
    );
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });

  test("castle kingside white", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(4, 6, WHITE_KING, null, null, false, false);
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });

  test("castle queenside white", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(4, 2, WHITE_KING, null, null, false, false);
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });

  test("castle kingside black", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(60, 62, BLACK_KING, null, null, false, false);
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });

  test("castle queenside black", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(60, 58, BLACK_KING, null, null, false, false);
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });

  test("debug position", () => {
    const fen = "4r1k1/1p1r1p2/3p1b1p/1p1P1Pp1/4n3/P3B2P/1PP3P1/1R1R2K1 w - g6 0 1";
    const fenData = getFENData(fen);
    bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    initializePieceAtArray(bitboards);
    computeAllAttackMasks(bitboards);
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(37, 46, 0, 6, null, false, true);
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });
});
