import {
  bitboardsToFEN,
  getFENData,
  uciToMove,
} from "../components/bitboardUtils/FENandUCIHelpers";

describe("FEN - Board Conversions", () => {
  const fens = [
    // [ description, FEN string ]
    [
      "Start position",
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    ],
    ["Empty board", "8/8/8/8/8/8/8/8 w - - 0 1"],
    [
      "Kiwipete position",
      "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
    ],
    ["Underpromotion test", "4k3/1pP5/8/8/8/8/8/4K3 w - - 0 1"],
    ["En passant available", "k7/8/8/3pP3/8/8/8/4K3 w - d6 0 1"],
  ];

  test.each(fens)(
    "%s round-trips through fenToBoard to boardToFEN",
    (_desc, fen) => {
      const fenData = getFENData(fen);
      const fen2 = bitboardsToFEN(
        fenData.bitboards,
        fenData.player,
        fenData.castling,
        fenData.ep
      );
      expect(fen2).toBe(fen);
    }
  );

  test.each(fens)(
    "%s round-trips through boardToFEN to fenToBoard",
    (_desc, fen) => {
      const fenData = getFENData(fen);
      const fenData2 = getFENData(bitboardsToFEN(fenData.bitboards,
        fenData.player,
        fenData.castling,
        fenData.ep));
      expect(fenData.bitboards).toEqual(fenData2.bitboards);
    }
  );
});
