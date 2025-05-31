import { jest } from "@jest/globals";
import { evaluate5 } from "../components/bbEngines/BMV5/evaluation5.mjs";
import { getFENData } from "../components/bitboardUtils/FENandUCIHelpers.mjs";
import { initializePieceIndicies } from "../components/bitboardUtils/pieceIndicies.mjs";
import { computeAllAttackMasks } from "../components/bitboardUtils/PieceMasks/individualAttackMasks.mjs";
import { initializePieceAtArray } from "../components/bitboardUtils/pieceGetters.mjs";

const cases = [
  ["Start pos", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", 0],
  // [
  //   "“Kiwipete” pos",
  //   "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
  //   0,
  // ],
  ["Pinned Pieces pos", "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1", -20],
  // [
  //   "Complex pos",
  //   "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
  //   0,
  // ],
  // [
  //   "Knight Fork",
  //   "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8",
  //   0,
  // ],
  // [
  //   "Alt Perft by Steven Edwards",
  //   "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10",
  //   0,
  // ],
];

describe("Evaluate using Piece-Square Tables", () => {
  test.each(cases)("%s has correct evaluation", (_name, fen, expectedEval) => {
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const calculatedEval = evaluate5(bitboards, player, null, 0);
    expect(calculatedEval).toBe(expectedEval);
  });
});