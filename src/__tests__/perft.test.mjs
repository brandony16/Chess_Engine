import { getFENData } from "../components/bitboardUtils/FENandUCIHelpers.mjs";
import { initializePieceAtArray } from "../components/bitboardUtils/pieceGetters.mjs";
import { indexArrays, initializePieceIndicies } from "../components/bitboardUtils/pieceIndicies.mjs";
import { computeAllAttackMasks } from "../components/bitboardUtils/PieceMasks/individualAttackMasks.mjs";
import { perft, perftDivide } from "./perft.mjs";

const cases = [
  // [ description, depth, expected node count, FEN ]
  [
    "Start pos",
    1,
    20,
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  ],
  [
    "Start pos",
    2,
    400,
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  ],
  [
    "Start pos",
    3,
  
    8902,
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  ],
  [
    "Start pos",
    4,
    197_281,
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  ],
  [
    "Start pos",
    5,
    4_865_609,
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  ],
  [
    "“Kiwipete” pos",
    1,
    48,
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
  ],
  [
    "“Kiwipete” pos",
    2,
    2039,
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
  ],
  [
    "Kiwipete” pos",
    3,
    97_862,
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
  ],
  [
    "Kiwipete” pos",
    4,
    4_085_603,
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
  ],
  ["Pinned Pieces pos", 1, 14, "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"],
  ["Pinned Pieces pos", 2, 191, "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"],
  ["Pinned Pieces pos", 3, 2812, "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"],
  ["Pinned Pieces pos", 4, 43_238, "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"],
  [
    "Complex pos",
    2,
    264,
    "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
  ],
  [
    "Complex pos",
    3,
    9467,
    "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
  ],
  [
    "Knight Fork",
    3,
    62_379,
    "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8",
  ],
  [
    "Alt Perft by Steven Edwards",
    3,
    89_890,
    "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10",
  ],
];

describe("perft node counts", () => {
  test.each(cases)("%s depth %i → %i nodes", (_desc, depth, expected, fen) => {
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    // const nodes = perft(bitboards, player, castling, ep, depth)
    const div = perftDivide(bitboards, player, castling, ep, depth);
    console.table(div);

    const nodes = Object.values(div).reduce((a, b) => a + b, 0);
    expect(nodes).toBe(expected);
  });
});
