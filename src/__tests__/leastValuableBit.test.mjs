import { BLACK, WHITE } from "../coreLogic/constants.mjs";
import { getFENData } from "../coreLogic/helpers/FENandUCIHelpers.mjs";
import { getLeastValuableBit } from "../coreLogic/leastValuableBit.mjs";
import {
  getAllPieces,
  initializePieceAtArray,
} from "../coreLogic/pieceGetters.mjs";
import { initializePieceIndicies } from "../coreLogic/pieceIndicies.mjs";
import { attacksTo } from "../coreLogic/PieceMasks/attacksTo.mjs";
import { computeAllAttackMasks } from "../coreLogic/PieceMasks/individualAttackMasks.mjs";

describe("getLeastValuableBit", () => {
  it("should return 0n when there are no attackers for that side", () => {
    const fen =
      "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);
    const occ = getAllPieces(bitboards);

    const toSq1 = 63; // rook on h8 - defended by black, not attacked
    const attadef1 = attacksTo(bitboards, occ, toSq1);
    const lvb1 = getLeastValuableBit(bitboards, attadef1, WHITE);
    expect(lvb1).toBe(0n);

    const toSq2 = 21; // Queen on f3 - defended by white, not attacked
    const attadef2 = attacksTo(bitboards, occ, toSq2);
    const lvb2 = getLeastValuableBit(bitboards, attadef2, BLACK);
    expect(lvb2).toBe(0n);
  });

  it("should be a pawn bit when that is the lvb", () => {
    const fen =
      "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);
    const occ = getAllPieces(bitboards);

    const toSq1 = 44; // Pawn on e6 - defended by pawn and queen
    const attadef1 = attacksTo(bitboards, occ, toSq1);
    const lvb1 = getLeastValuableBit(bitboards, attadef1, BLACK);
    const exp1 = 1n << 51n; // First pawn defending
    expect(lvb1).toBe(exp1);

    const toSq2 = 18; // Knight on c3 - defended by pawn, queen, and bishop
    const attadef2 = attacksTo(bitboards, occ, toSq2);
    const lvb2 = getLeastValuableBit(bitboards, attadef2, WHITE);
    const exp2 = 1n << 9n;
    expect(lvb2).toBe(exp2);
  });

  it("should be a knight bit when that is the lvb", () => {
    const fen =
      "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
    const fenData = getFENData(fen);
    const bitboards = fenData.bitboards;

    initializePieceIndicies(bitboards);
    computeAllAttackMasks(bitboards);
    initializePieceAtArray(bitboards);
    const occ = getAllPieces(bitboards);

    const toSq1 = 26; // c4 - attacked by knight and bishop on both sides
    const attadef1 = attacksTo(bitboards, occ, toSq1);
    const lvb1 = getLeastValuableBit(bitboards, attadef1, WHITE);
    const exp1 = 1n << 36n; // White knight
    const lvb2 = getLeastValuableBit(bitboards, attadef1, BLACK);
    const exp2 = 1n << 41n; // Black knight
    expect(lvb1).toBe(exp1);
    expect(lvb2).toBe(exp2);
  });
});
