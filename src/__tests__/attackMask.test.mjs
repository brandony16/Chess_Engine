import {
  BLACK_BISHOP,
  BLACK_KING,
  BLACK_PAWN,
  BLACK_ROOK,
  NUM_PIECES,
  WHITE_BISHOP,
  WHITE_KING,
  WHITE_PAWN,
  WHITE_ROOK,
} from "../components/bitboardUtils/constants.mjs";
import { makeMove, unMakeMove } from "../components/bitboardUtils/moveMaking/makeMoveLogic.mjs";
import Move from "../components/bitboardUtils/moveMaking/move.mjs";
import { initializePieceAtArray } from "../components/bitboardUtils/pieceGetters.mjs";
import {
  indexArrays,
  initializePieceIndicies,
} from "../components/bitboardUtils/pieceIndicies.mjs";
import {
  computeAllAttackMasks,
  individualAttackMasks,
} from "../components/bitboardUtils/PieceMasks/individualAttackMasks.mjs";

describe("updateAttackMasks vs full recompute", () => {
  let bitboards;

  // Set up a base position for the tests
  beforeEach(() => {
    bitboards = new BigUint64Array(NUM_PIECES).fill(0n);

    // White pieces:
    bitboards[WHITE_KING] = 1n << 4n;
    bitboards[WHITE_ROOK] = 1n << 7n;
    bitboards[WHITE_BISHOP] = 1n << 2n;
    // Black pieces:
    bitboards[BLACK_KING] = 1n << 60n;
    bitboards[BLACK_ROOK] = 1n << 56n;
    bitboards[BLACK_BISHOP] = 1n << 61n;

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

  test("sliding move white", () => {
    // Snapshot old masks & bitboards
    const oldMasks = individualAttackMasks.slice();

    const move = new Move(7, 15, WHITE_ROOK, null, null, false, false);
    makeMove(bitboards, move);

    const afterMoveAttackMasks = individualAttackMasks.slice();
    computeAllAttackMasks(bitboards);
    expect(afterMoveAttackMasks).toEqual(individualAttackMasks);
    expect(afterMoveAttackMasks).not.toEqual(oldMasks);

    unMakeMove(move, bitboards);
    expect(oldMasks).toEqual(individualAttackMasks);
  });
  
  test("sliding move black", () => {
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

  // test("sliding move updates attack masks correctly (rook moves)", () => {
  //   // Move White Rook from h1 (7) → h3 (23). That changes the white rook’s attacks,
  //   // and may also affect black rook’s masking if they align (they don’t here).
  //   const move = {
  //     piece: WHITE_ROOK,
  //     from: 7,
  //     to: 23,
  //     captured: null,
  //     promotion: null,
  //     enPassant: false,
  //     castling: false,
  //   };

  //   const oldOcc = getAllPieces(bitboards);
  //   const oldMasks = individualAttackMasks.slice();
  //   const oldLists = indexArrays.map((arr) => arr.slice());
  //   const oldBB = cloneBitboards(bitboards);

  //   // Make the move
  //   makeMoveOnBitboards(bitboards, move);
  //   updatePieceLists(move);

  //   // Incremental update
  //   updateAttackMasks(bitboards, move, oldOcc);

  //   // Full recompute
  //   const freshMasks = fullRecomputeAllMasks(bitboards);

  //   // Verify only rook‐related sliding masks changed as expected
  //   // White rook mask:
  //   expect(individualAttackMasks[WHITE_ROOK]).toBe(freshMasks[WHITE_ROOK]);
  //   // White queen mask includes rook directions; recompute must match
  //   expect(individualAttackMasks[WHITE_QUEEN]).toBe(freshMasks[WHITE_QUEEN]);
  //   // Black rook mask should be unchanged in this scenario
  //   expect(individualAttackMasks[BLACK_ROOK]).toBe(freshMasks[BLACK_ROOK]);
  //   // Other sliding types:
  //   expect(individualAttackMasks[WHITE_BISHOP]).toBe(freshMasks[WHITE_BISHOP]);
  //   expect(individualAttackMasks[BLACK_BISHOP]).toBe(freshMasks[BLACK_BISHOP]);
  //   expect(individualAttackMasks[BLACK_QUEEN]).toBe(freshMasks[BLACK_QUEEN]);

  //   // Restore
  //   restoreBitboards(bitboards, oldBB);
  //   individualAttackMasks = oldMasks;
  //   indexArrays.forEach((arr, i) => arr.splice(0, arr.length, ...oldLists[i]));
  // });

  // test("capture move updates attack masks correctly (bishop captures)", () => {
  //   // Place an extra white pawn on c7 (sq=50) so black bishop on f8 can capture it
  //   bitboards[WHITE_PAWN] |= 1n << 50n;
  //   indexArrays[WHITE_PAWN].push(50);

  //   bitboards[WHITE_PAWN] &= ~(1n << 50n); // remove from c7
  //   indexArrays[WHITE_PAWN].splice(indexArrays[WHITE_PAWN].indexOf(50), 1);
  //   bitboards[WHITE_PAWN] |= 1n << 16n;
  //   indexArrays[WHITE_PAWN].push(16);

  //   const move = {
  //     piece: BLACK_BISHOP,
  //     from: 61, // f8
  //     to: 16, // a3
  //     captured: WHITE_PAWN,
  //     promotion: null,
  //     enPassant: false,
  //     castling: false,
  //   };

  //   const oldOcc = getAllPieces(bitboards);
  //   const oldMasks = individualAttackMasks.slice();
  //   const oldLists = indexArrays.map((arr) => arr.slice());
  //   const oldBB = cloneBitboards(bitboards);

  //   // Make the capture
  //   makeMoveOnBitboards(bitboards, move);
  //   updatePieceLists(move);

  //   // Incremental update
  //   updateAttackMasks(bitboards, move, oldOcc);

  //   // Full recompute
  //   const freshMasks = fullRecomputeAllMasks(bitboards);

  //   // Verify updated masks:
  //   expect(individualAttackMasks[BLACK_BISHOP]).toBe(freshMasks[BLACK_BISHOP]);
  //   expect(individualAttackMasks[BLACK_QUEEN]).toBe(freshMasks[BLACK_QUEEN]);
  //   // White pawn mask should be removed entirely
  //   expect(individualAttackMasks[WHITE_PAWN]).toBe(0n);
  //   // Other sliding masks should match
  //   expect(individualAttackMasks[WHITE_ROOK]).toBe(freshMasks[WHITE_ROOK]);
  //   expect(individualAttackMasks[WHITE_BISHOP]).toBe(freshMasks[WHITE_BISHOP]);
  //   expect(individualAttackMasks[BLACK_ROOK]).toBe(freshMasks[BLACK_ROOK]);
  //   expect(individualAttackMasks[WHITE_QUEEN]).toBe(freshMasks[WHITE_QUEEN]);

  //   // Restore
  //   restoreBitboards(bitboards, oldBB);
  //   individualAttackMasks = oldMasks;
  //   indexArrays.forEach((arr, i) => arr.splice(0, arr.length, ...oldLists[i]));
  // });
});
