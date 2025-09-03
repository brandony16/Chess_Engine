import { getFENData } from "../coreLogic/helpers/FENandUCIHelpers.mjs";
import {
  getAllPieces,
  initializePieceAtArray,
} from "../coreLogic/pieceGetters.mjs";
import { initializePieceIndicies } from "../coreLogic/pieceIndicies.mjs";
import { attacksTo } from "../coreLogic/PieceMasks/attacksTo.mjs";
import { computeAllAttackMasks } from "../coreLogic/PieceMasks/individualAttackMasks.mjs";

describe("attacksTo", () => {
  it("should return 0n when no attackers white", () => {
    const fen =
      "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const toSq = 36; // knight on e5 - not attacked or defended
    const occ = getAllPieces(bitboards);
    const attadef = attacksTo(bitboards, occ, toSq);

    expect(attadef).toBe(0n);
  });

  it("should return 0n when no attackers black", () => {
    const fen =
      "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const toSq = 50; // c7 - not attacked or defended
    const occ = getAllPieces(bitboards);
    const attadef = attacksTo(bitboards, occ, toSq);

    expect(attadef).toBe(0n);
  });

  it("should identify correct attackers and defenders (white piece 1)", () => {
    const fen =
      "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const toSq = 35; // d5 - attacked 3 times, defended twice
    const occ = getAllPieces(bitboards);
    const attadef = attacksTo(bitboards, occ, toSq);

    const defenders = (1n << 18n) | (1n << 28n);
    const attackers = (1n << 41n) | (1n << 44n) | (1n << 45n);
    const expected = defenders | attackers;

    expect(attadef).toBe(expected);
  });

  it("should identify correct attackers and defenders (white piece 2)", () => {
    const fen =
      "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const toSq = 18; // c3 - attacked 1 time, defended thrice
    const occ = getAllPieces(bitboards);
    const attadef = attacksTo(bitboards, occ, toSq);

    const defenders = (1n << 9n) | (1n << 11n) | (1n << 21n);
    const attackers = 1n << 25n;
    const expected = defenders | attackers;

    expect(attadef).toBe(expected);
  });

  it("should identify correct attackers and defenders (black piece 1)", () => {
    const fen =
      "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const toSq = 23; // h3 - attacked 2 times, defended once
    const occ = getAllPieces(bitboards);
    const attadef = attacksTo(bitboards, occ, toSq);

    const defenders = 1n << 63n;
    const attackers = (1n << 21n) | (1n << 14n);
    const expected = defenders | attackers;

    expect(attadef).toBe(expected);
  });

  it("should identify correct attackers and defenders (black piece 2)", () => {
    const fen =
      "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);

    const toSq = 51; // d7 - attacked 1 time, defended four times
    const occ = getAllPieces(bitboards);
    const attadef = attacksTo(bitboards, occ, toSq);

    const defenders = (1n << 41n) | (1n << 45n) | (1n << 52n) | (1n << 60n);
    const attackers = 1n << 36n;
    const expected = defenders | attackers;

    expect(attadef).toBe(expected);
  });
});
