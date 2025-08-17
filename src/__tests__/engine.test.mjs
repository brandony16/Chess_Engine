import { BMV5 } from "../components/bbEngines/BMV5/BondMonkeyV5.mjs";
import { getNewEnPassant } from "../coreLogic/bbChessLogic";
import { BLACK_KNIGHT, WHITE_KNIGHT } from "../coreLogic/constants.mjs";
import { areBigUint64ArraysEqual } from "../coreLogic/debugFunctions";
import { getFENData } from "../coreLogic/helpers/FENandUCIHelpers";
import { getAllLegalMoves } from "../coreLogic/moveGeneration/allMoveGeneration";
import { updateCastlingRights } from "../coreLogic/moveMaking/castleMoveLogic";
import { makeMove, unMakeMove } from "../coreLogic/moveMaking/makeMoveLogic";
import { initializePieceAtArray, pieceAt } from "../coreLogic/pieceGetters";
import { initializePieceIndicies } from "../coreLogic/pieceIndicies.mjs";
import { computeAllAttackMasks } from "../coreLogic/PieceMasks/individualAttackMasks";
import { computeHash } from "../coreLogic/zobristHashing";
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

    initializePieceIndicies(bitboards);
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

describe("Engine finds obvious best moves", () => {
  test("engine captures a hanging piece with white", () => {
    const fen = "8/3r4/8/6k1/8/2R5/5K2/2b5 w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const engineObj = BMV5(bitboards, player, castling, ep, new Map(), 4);
    expect(engineObj.from).toBe(18);
    expect(engineObj.to).toBe(2);
  });

  test("engine captures a hanging piece with black", () => {
    const fen = "r5k1/5b2/8/8/2N5/8/8/6K1 b - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const engineObj = BMV5(bitboards, player, castling, ep, new Map(), 4);
    expect(engineObj.from).toBe(53);
    expect(engineObj.to).toBe(26);
  });

  test("engine plays mate in 1 for white", () => {
    const fen = "5k2/2Q5/5K2/8/8/8/8/8 w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const engineObj = BMV5(bitboards, player, castling, ep, new Map(), 4);
    expect(engineObj.from).toBe(50);
    expect(engineObj.to).toBe(53);
  });

  test("engine plays mate in 1 for black", () => {
    const fen = "8/8/r7/6k1/8/8/1r6/5K2 b - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const engineObj = BMV5(bitboards, player, castling, ep, new Map(), 4);
    expect(engineObj.from).toBe(40);
    expect(engineObj.to).toBe(0);
  });

  test("engine plays mate in 2 for white", () => {
    const fen = "b5k1/1Q4p1/7p/8/8/8/8/3BR1K1 w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const engineObj = BMV5(bitboards, player, castling, ep, new Map(), 4);
    expect(engineObj.from).toBe(4);
    expect(engineObj.to).toBe(60);
  });

  test("engine plays mate in 2 for black", () => {
    const fen = "3br1k1/8/8/8/8/7P/1q4P1/B5K1 b - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const engineObj = BMV5(bitboards, player, castling, ep, new Map(), 4);
    expect(engineObj.from).toBe(60);
    expect(engineObj.to).toBe(4);
  });

  test("engine correctly calculates capture sequence for white", () => {
    const fen = "3q2k1/pp1r1ppp/3r4/3n4/8/1B1R4/PP1R1PPP/3Q2K1 w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const engineObj = BMV5(bitboards, player, castling, ep, new Map(), 4);
    expect(engineObj.captured).toBe(BLACK_KNIGHT);
  });

  test("engine correctly calculates good capture sequence for black", () => {
    const fen = "3q2k1/pp1r1ppp/1b1r4/8/3N4/3R4/PP1R1PPP/3Q2K1 b - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const engineObj = BMV5(bitboards, player, castling, ep, new Map(), 4);
    expect(engineObj.captured).toBe(WHITE_KNIGHT);
  });

  test("engine correctly calculates bad capture sequence for white", () => {
    const fen = "3q2k1/pp1r1ppp/3r4/3n4/8/3R4/PP1R1PPP/3Q2K1 w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const engineObj = BMV5(bitboards, player, castling, ep, new Map(), 4);
    expect(engineObj.captured).toBe(null);
  });

  test("engine correctly calculates bad capture sequence for black", () => {
    const fen = "3q2k1/pp1r1ppp/3r4/8/3N4/3R4/PP1R1PPP/3Q2K1 b - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const engineObj = BMV5(bitboards, player, castling, ep, new Map(), 1);
    expect(engineObj.captured).toBe(null);
  });

  test("debug", () => {
    const fen =
      "r2qkb1r/pp2pppp/2n2P2/8/2p2P2/2pP1P2/PPP1Q2P/R1B1KB1R w - - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;
    const player = fenData.player;
    const castling = fenData.castling;
    const ep = fenData.ep;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const engineObj = BMV5(bitboards, player, castling, ep, new Map(), 1);
    expect(engineObj).not.toBe(null);
  });
});
