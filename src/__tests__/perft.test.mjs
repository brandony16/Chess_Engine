import { getFENData } from "../components/bitboardUtils/FENandUCIHelpers";
import { perft } from "./perft";

const cases = [
  // [ description, FEN, depth, expected node count ]
  [
    "Start pos",
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    1,
    20,
  ],
  [
    "Start pos",
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    2,
    400,
  ],
  [
    "Start pos",
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    3,
    8902,
  ],
  [
    "Start pos",
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    4,
    197_281,
  ],
  [
    "Start pos",
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    3,
    4_865_609,
  ],

  [
    "“Kiwipete” pos",
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
    1,
    48,
  ],
  [
    "“Kiwipete” pos",
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
    2,
    2039,
  ],
  ["Pinned Pieces pos", "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1", 1, 14],
  ["Pinned Pieces pos", "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1", 2, 191],
  ["Pinned Pieces pos", "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1", 3, 2812],
  [
    "Complex pos",
    "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
    2,
    264,
  ],
  [
    "Complex pos",
    "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
    3,
    9467,
  ],
];

describe("perft node counts", () => {
  test.each(cases)("%s depth %i → %i nodes", (_desc, fen, depth, expected) => {
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;

    const nodes = perft(bitboards, player, castling, ep, depth);
    expect(nodes).toBe(expected);
  });
});
