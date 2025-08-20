import {
  calculatePhase,
  MAX_PHASE,
} from "../coreLogic/engines/BMV7/evaluation/phase";
import { getFENData } from "../coreLogic/helpers/FENandUCIHelpers.mjs";
import { initializePieceAtArray } from "../coreLogic/pieceGetters.mjs";
import { initializePieceIndicies } from "../coreLogic/pieceIndicies.mjs";
import { computeAllAttackMasks } from "../coreLogic/PieceMasks/individualAttackMasks.mjs";

describe("calculatePhase", () => {
  it("should be max phase at the start", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const phase = calculatePhase();

    expect(phase).toBe(MAX_PHASE);
  });

  it("should be 0 when no major or minor pieces", () => {
    const fen = "8/2pp1k1p/1p2p3/3P4/8/2P1PP2/PP1K4/8 w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const phase = calculatePhase();

    expect(phase).toBe(0);
  });

  it("should calculate an intermediate phase value", () => {
    const fen = "8/2pp1k1p/1p2pq2/2bP4/8/1NPBPP2/PP1K4/7R w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const phase = calculatePhase();

    expect(phase).toBe(9);
  });
});
