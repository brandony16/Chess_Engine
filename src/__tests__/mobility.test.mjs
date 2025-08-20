import { calculateMobility } from "../components/bbEngines/mobility.mjs";
import { getMobility } from "../components/bbEngines/mobilityTables.mjs";
import {
  BLACK,
  BLACK_BISHOP,
  BLACK_KNIGHT,
  BLACK_QUEEN,
  BLACK_ROOK,
  WHITE,
  WHITE_BISHOP,
  WHITE_KNIGHT,
  WHITE_QUEEN,
  WHITE_ROOK,
} from "../coreLogic/constants.mjs";
import { getFENData } from "../coreLogic/helpers/FENandUCIHelpers.mjs";
import { initializePieceAtArray } from "../coreLogic/pieceGetters.mjs";
import { initializePieceIndicies } from "../coreLogic/pieceIndicies.mjs";
import { computeAllAttackMasks } from "../coreLogic/PieceMasks/individualAttackMasks.mjs";

describe("calculateMobility", () => {
  it("should calculate the correct mobility scores for minor pieces", () => {
    const fen = "6b1/1N6/8/8/1B6/5n2/8/8 w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const whiteMobility = calculateMobility(bitboards, WHITE);
    const blackMobility = calculateMobility(bitboards, BLACK);

    expect(whiteMobility).toBe(
      getMobility(WHITE_KNIGHT, 4) + getMobility(WHITE_BISHOP, 9)
    );
    expect(blackMobility).toBe(
      getMobility(BLACK_KNIGHT, 8) + getMobility(BLACK_BISHOP, 7)
    );
  });

  it("should calculate the correct mobility score for major pieces", () => {
    const fen = "3K4/q7/8/5r2/8/k7/3Q4/1R6 w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const whiteMobility = calculateMobility(bitboards, WHITE);
    const blackMobility = calculateMobility(bitboards, BLACK);

    // King is 0
    expect(whiteMobility).toBe(
      getMobility(WHITE_ROOK, 14) + getMobility(WHITE_QUEEN, 22)
    );
    expect(blackMobility).toBe(
      getMobility(BLACK_ROOK, 14) + getMobility(BLACK_QUEEN, 18)
    );
  });

  it("should include captures", () => {
    const fen = "8/8/1r3P2/8/2p5/8/4B3/8 w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const whiteMobility = calculateMobility(bitboards, WHITE);
    const blackMobility = calculateMobility(bitboards, BLACK);

    expect(whiteMobility).toBe(getMobility(WHITE_BISHOP, 7));
    expect(blackMobility).toBe(getMobility(BLACK_ROOK, 12));
  });
});
