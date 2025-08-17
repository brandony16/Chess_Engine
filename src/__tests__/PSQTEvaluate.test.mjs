import { evaluate5 } from "../components/bbEngines/BMV5/evaluation5.mjs";
import { getFENData } from "../Core Logic/helpers/FENandUCIHelpers.mjs";
import { initializePieceIndicies } from "../Core Logic/pieceIndicies.mjs";
import { computeAllAttackMasks } from "../Core Logic/PieceMasks/individualAttackMasks.mjs";
import { initializePieceAtArray } from "../Core Logic/pieceGetters.mjs";

const cases = [
  ["Start pos", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", 0],
  ["Pinned Pieces pos", "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1", -20],
];

describe("Evaluate using Piece-Square Tables", () => {
  test.each(cases)("%s has correct evaluation", (_name, fen, expectedEval) => {
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const calculatedEval = evaluate5(player, null, 0);
    expect(calculatedEval).toBe(expectedEval);
  });
});
