import { getNewEnPassant } from "../components/bitboardUtils/bbChessLogic";
import { areBigUint64ArraysEqual } from "../components/bitboardUtils/debugFunctions";
import { getFENData } from "../components/bitboardUtils/FENandUCIHelpers";
import { getAllLegalMoves } from "../components/bitboardUtils/moveGeneration/allMoveGeneration";
import { updateCastlingRights } from "../components/bitboardUtils/moveMaking/castleMoveLogic";
import {
  makeMove,
  unMakeMove,
} from "../components/bitboardUtils/moveMaking/makeMoveLogic";
import {
  initializePieceAtArray,
  pieceAt,
} from "../components/bitboardUtils/pieceGetters";
import { computeAllAttackMasks } from "../components/bitboardUtils/PieceMasks/individualAttackMasks";
import { computeHash } from "../components/bitboardUtils/zobristHashing";
import { mockEngine } from "./mockEngine";

const fens = [
  ["Start pos", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"],
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

describe("Engine values are right after one pass", () => {
  test.each(fens)("%s values are correct", (_desc, fen) => {
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;

    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);
    const hash = computeHash(
      bitboards,
      player,
      ep !== null ? ep % 8 : -1,
      castling
    );

    const stateArray = mockEngine(
      bitboards,
      player,
      castling,
      ep,
      new Map(),
      hash
    );

    const moves = getAllLegalMoves(bitboards, player, castling, ep);
    for (let i = 0; i < stateArray.length; i++) {
      const obj = stateArray[i];
      const move = obj.move;
      expect(moves).toContainEqual(move);
      expect(obj.prevHash).toBe(hash);

      makeMove(bitboards, move);

      expect(areBigUint64ArraysEqual(bitboards, obj.bitboards)).toBe(true);

      expect(obj.pieceAt).toEqual(pieceAt);

      let newEpFile = -1;
      if (getNewEnPassant(move)) {
        newEpFile = move.to % 8;
      }
      expect(obj.newEpFile).toBe(newEpFile);

      const newCastling = updateCastlingRights(move.from, move.to, castling);
      // const newHash = computeHash(
      //   bitboards,
      //   player === WHITE ? BLACK : WHITE,
      //   newEpFile,
      //   newCastling
      // );
      // expect(obj.hash).toBe(newHash);

      const castlingChanged = [
        castling[0] !== newCastling[0],
        castling[1] !== newCastling[1],
        castling[2] !== newCastling[2],
        castling[3] !== newCastling[3],
      ];
      expect(obj.castlingChanged).toEqual(castlingChanged);
      expect(obj.prevEpFile).toBe(ep ? ep % 8 : -1);

      unMakeMove(move, bitboards);
    }
  });
});
