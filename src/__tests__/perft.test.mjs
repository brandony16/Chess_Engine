import { getFENData } from "../components/bitboardUtils/FENandUCIHelpers";
import { getCachedAttackMask } from "../components/bitboardUtils/PieceMasks/attackMask";
import { computeHash } from "../components/bitboardUtils/zobristHashing";
import { perft, perftDivide } from "./perft";

const cases = [
  // [ description, FEN, depth, expected node count ]
  [
    "Start pos debug",
    2,
    420,
    "rnbqkbnr/pppppppp/8/8/7P/8/PPPPPPP1/RNBQKBNR b KQkq - 0 1"
  ],
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
  // [
  //   "Start pos",
  //   5,
  //   4_865_609,
  //   "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  // ],

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
  ["Pinned Pieces pos", 1, 14, "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"],
  ["Pinned Pieces pos", 2, 191, "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"],
  ["Pinned Pieces pos", 3, 2812, "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"],
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
];

describe("perft node counts", () => {
  test.each(cases)("%s depth %i → %i nodes", (_desc, depth, expected, fen) => {
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;
    const attackHash = computeHash(bitboards, player);
    getCachedAttackMask(bitboards, player, attackHash); // Puts hash in map

    const div = perftDivide(bitboards, player, castling, ep, attackHash, depth);
    console.table(div);

    const nodes = Object.values(div).reduce((a, b) => a + b, 0);
    expect(nodes).toBe(expected);
  });
});

const startPerft3 = {
  a2a3: 380,
  b2b3: 420,
  c2c3: 420,
  d2d3: 539,
  e2e3: 599,
  f2f3: 380,
  g2g3: 420,
  h2h3: 380,
  a2a4: 420,
  b2b4: 421,
  c2c4: 441,
  d2d4: 560,
  e2e4: 600,
  f2f4: 401,
  g2g4: 421,
  h2h4: 420,
  b1a3: 400,
  b1c3: 440,
  g1f3: 440,
  g1h3: 400,
};

const wrong = {
  a2a3: 380,
  b2b3: 420,
  c2c3: 420,
  d2d3: 539,
  e2e3: 599,
  f2f3: 380,
  g2g3: 420,
  h2h3: 380,
  a2a4: 420,
  b2b4: 421,
  c2c4: 441,
  d2d4: 560,
  e2e4: 600,
  f2f4: 401,
  g2g4: 421,
  h2h4: 421,
  b1a3: 400,
  b1c3: 440,
  g1f3: 440,
  g1h3: 400,
};
