import { BLACK, WHITE } from "../components/bitboardUtils/constants";
import { getFENData } from "../components/bitboardUtils/FENandUCIHelpers";
import { getAllLegalMoves } from "../components/bitboardUtils/moveGeneration/allMoveGeneration";
import { updateCastlingRights } from "../components/bitboardUtils/moveMaking/castleMoveLogic";
import { makeMove } from "../components/bitboardUtils/moveMaking/makeMoveLogic";
import {
  initializePieceAtArray,
  pieceAt,
} from "../components/bitboardUtils/pieceGetters";
import { computeAllAttackMasks } from "../components/bitboardUtils/PieceMasks/individualAttackMasks";
import { computeHash } from "../components/bitboardUtils/zobristHashing";
import { mockEngine } from "./mockEngine";

const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("Engine values are right after one pass", () => {
  const fenData = getFENData(fen);
  const bitboards = fenData.bitboards;
  const player = fenData.player;
  const castling = fenData.castling;
  const ep = fenData.ep;

  computeAllAttackMasks(bitboards);
  initializePieceAtArray(bitboards);
  const hash = computeHash(bitboards, player, ep !== null ? ep % 8 : -1, castling);

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
    initializePieceAtArray(bitboards);

    expect(obj.bitboards.toString()).toEqual(bitboards.toString());
    expect(obj.pieceAt).toEqual(pieceAt);

    let newEpFile = -1;
    if (move.enpassant) {
      newEpFile = move.to % 8;
    }
    expect(obj.newEpFile).toBe(newEpFile);

    const newCastling = updateCastlingRights(move.from, move.to, castling);
    const newHash = computeHash(
      bitboards,
      player === WHITE ? BLACK : WHITE,
      newEpFile,
      newCastling
    );
    expect(obj.hash).toBe(newHash);

    const castlingChanged = [
      castling[0] !== newCastling[0],
      castling[1] !== newCastling[1],
      castling[2] !== newCastling[2],
      castling[3] !== newCastling[3],
    ];
    expect(obj.castlingChanged).toEqual(castlingChanged);
    expect(obj.prevEpFile).toBe(ep ? ep % 8 : -1);
  }
});
