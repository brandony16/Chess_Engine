import { getFENData } from "../Core Logic/FENandUCIHelpers";
import { getAllLegalMoves } from "../Core Logic/moveGeneration/allMoveGeneration";
import { initializePieceAtArray } from "../Core Logic/pieceGetters";
import { initializePieceIndicies } from "../Core Logic/pieceIndicies";
import { computeAllAttackMasks } from "../Core Logic/PieceMasks/individualAttackMasks";

const cases = [
  [
    "Initial position",
    20,
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  ],
  [
    "After 1.e4",
    20,
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
  ],
  ["King and rook only", 6, "8/8/8/8/8/8/4K2r/8 w - - 0 1"],
  [
    "Kiwipete complex",
    48,
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
  ],
  ["Pin & blockade", 10, "8/2p5/3p4/KP5r/1R3p1k/8/8/8 w - - 0 1"],
  ["Promotion trap", 24, "n1n5/PPPk4/8/8/8/8/4Kppp/5N1N b - - 0 1"],
  ["Underpromotion", 9, "4k3/1pP5/8/8/8/8/8/4K3 w - - 0 1"],
  ["En passant", 7, "k7/8/8/3pP3/8/8/8/4K3 w - d6 0 1"],
  ["Castling only", 26, "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1"],
  ["Discovered check", 13, "4k3/8/8/3pN3/8/8/8/4K3 w - - 0 1"],
];

describe("GetAllLegalMoves", () => {
  test.each(cases)(
    "%s should generate %i moves",
    (_description, expectedCount, fen) => {
      const state = getFENData(fen);
      const bitboards = state.bitboards;
      const player = state.player;
      const castling = state.castling;
      const ep = state.ep;

      initializePieceIndicies(bitboards);
      computeAllAttackMasks(bitboards);
      initializePieceAtArray(bitboards);

      const moves = getAllLegalMoves(bitboards, player, castling, ep);

      expect(moves.length).toBe(expectedCount);
    }
  );
});
