import { BLACK, WHITE } from "../components/bitboardUtils/constants";
import { getFENData } from "../components/bitboardUtils/FENandUCIHelpers";
import { bigIntFullRep } from "../components/bitboardUtils/generalHelpers";
import {
  clearAttackMaskCache,
  computeAttackMask,
  getCachedAttackMask,
} from "../components/bitboardUtils/PieceMasks/attackMask";
import { computeAllAttackMasks } from "../components/bitboardUtils/PieceMasks/individualAttackMasks";
import { computeHash } from "../components/bitboardUtils/zobristHashing";
import { perft, perftDivide } from "./perft";

const cases = [
  // [ description, FEN, depth, expected node count ]
  ["Pinned Pieces pos", 2, 177, "8/2p5/3p4/KP5r/1R2Pp1k/8/6P1/8 b - e3 0 1"],

  // [
  //   "Start pos",
  //   1,
  //   20,
  //   "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  // ],
  // [
  //   "Start pos",
  //   2,
  //   400,
  //   "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  // ],
  // [
  //   "Start pos",
  //   3,
  //   8902,
  //   "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  // ],
  // [
  //   "Start pos",
  //   4,
  //   197_281,
  //   "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  // ],
  // // [
  // //   "Start pos",
  // //   5,
  // //   4_865_609,
  // //   "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  // // ],

  // [
  //   "“Kiwipete” pos",
  //   1,
  //   48,
  //   "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
  // ],
  // [
  //   "“Kiwipete” pos",
  //   2,
  //   2039,
  //   "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
  // ],
  // ["Pinned Pieces pos", 1, 14, "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"],
  // ["Pinned Pieces pos", 2, 191, "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"],
  ["Pinned Pieces pos", 3, 2812, "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"],
  // [
  //   "Complex pos",
  //   2,
  //   264,
  //   "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
  // ],
  // [
  //   "Complex pos",
  //   3,
  //   9467,
  //   "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
  // ],
];

describe("perft node counts", () => {
  test.each(cases)("%s depth %i → %i nodes", (_desc, depth, expected, fen) => {
    clearAttackMaskCache();
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;

    const opponent = player === WHITE ? BLACK : WHITE;

    const attackHash = computeHash(bitboards, opponent);
    computeAllAttackMasks(bitboards);
    getCachedAttackMask(bitboards, opponent, attackHash); // Puts hash in map

    const div = perftDivide(bitboards, player, castling, ep, attackHash, depth);
    console.table(div);

    const nodes = Object.values(div).reduce((a, b) => a + b, 0);
    expect(nodes).toBe(expected);
  });
});


e2e4: 177
b4b2: 205
b4b3: 248

e2e4: 175
b4b2: 204
b4b3: 247

    // ┌─────────┬────────┐
    // │ (index) │ Values │
    // ├─────────┼────────┤
    // │ f4f3    │ 12     │
    // │ h4g3    │ 9      │
    // │ h4g4    │ 10     │
    // │ h4g5    │ 12     │
    // │ h5b5    │ 4      │
    // │ h5c5    │ 11     │
    // │ h5d5    │ 12     │
    // │ h5e5    │ 10     │
    // │ h5f5    │ 12     │
    // │ h5g5    │ 11     │
    // │ h5h6    │ 12     │
    // │ h5h7    │ 12     │
    // │ h5h8    │ 12     │
    // │ d6d5    │ 13     │
    // │ c7c5    │ 13     │
    // │ c7c6    │ 12     │
    // └─────────┴────────┘
    // ┌─────────┬────────┐
    // │ (index) │ Values │
    // ├─────────┼────────┤
    // │ f4f3    │ 12     │
    // │ h4g3    │ 9      │
    // │ h4g4    │ 10     │
    // │ h4g5    │ 12     │
    // │ h5b5    │ 4      │
    // │ h5c5    │ 11     │
    // │ h5d5    │ 12     │
    // │ h5e5    │ 10     │
    // │ h5f5    │ 12     │
    // │ h5g5    │ 11     │
    // │ h5h6    │ 12     │
    // │ h5h7    │ 12     │
    // │ h5h8    │ 12     │
    // │ d6d5    │ 13     │
    // │ c7c5    │ 12     │
    // │ c7c6    │ 11     │
    // └─────────┴────────┘
    
    // ┌─────────┬────────┐
    // │ (index) │ Values │
    // ├─────────┼────────┤
    // │ g2g3    │ 1      │
    // │ g2g4    │ 1      │
    // │ b4b1    │ 1      │
    // │ b4b2    │ 1      │
    // │ b4b3    │ 1      │
    // │ b4a4    │ 1      │
    // │ b4c4    │ 1      │
    // │ b4d4    │ 1      │
    // │ e4e5    │ 1      │
    // │ a5a4    │ 1      │
    // │ a5a6    │ 1      │
    // │ b5b6    │ 1      │
    // └─────────┴────────┘
    // ┌─────────┬────────┐
    // │ (index) │ Values │
    // ├─────────┼────────┤
    // │ g2g3    │ 1      │
    // │ g2g4    │ 1      │
    // │ b4b1    │ 1      │
    // │ b4b2    │ 1      │
    // │ b4b3    │ 1      │
    // │ b4a4    │ 1      │
    // │ b4c4    │ 1      │
    // │ b4d4    │ 1      │
    // │ e4e5    │ 1      │
    // │ a5a4    │ 1      │
    // │ a5a6    │ 1      │
    // │ a5b6    │ 1      │
    // │ b5b6    │ 1      │
    // └─────────┴────────┘