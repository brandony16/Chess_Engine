import { getFENData } from "../Core Logic/FENandUCIHelpers";
import { getAllLegalMoves } from "../Core Logic/moveGeneration/allMoveGeneration";
import { getQuiescenceMoves } from "../Core Logic/moveGeneration/quiescenceMoves.mjs";
import { initializePieceAtArray } from "../Core Logic/pieceGetters";
import { initializePieceIndicies } from "../Core Logic/pieceIndicies.mjs";
import { computeAllAttackMasks } from "../Core Logic/PieceMasks/individualAttackMasks.mjs";

const cases = [
  // ["Start pos", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"],
  [
    "“Kiwipete” pos",
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
  ],
  ["Pinned Pieces pos", "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"],
  [
    "Complex pos",
    "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
  ],
  ["Knight Fork", "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8"],
  [
    "Alt Perft by Steven Edwards",
    "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10",
  ],
];

describe("getQuiescenceMove", () => {
  test.each(cases)("%s quiescence moves are correct", (_desc, fen) => {
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const moves = getAllLegalMoves(bitboards, player, castling, ep);
    const filteredMoves = moves.filter(
      (move) => move.captured !== null || move.promotion
    );
    const quiescenceMoves = getQuiescenceMoves(bitboards, player, castling, ep);

    expect(quiescenceMoves.length).toBe(filteredMoves.length);
  });
});
