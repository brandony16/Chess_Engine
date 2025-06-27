import { initializePieceAtArray } from "../../Core Logic/pieceGetters";
import { initializePieceIndicies } from "../../Core Logic/pieceIndicies";
import { computeAllAttackMasks } from "../../Core Logic/PieceMasks/individualAttackMasks";
import { clearTT } from "../../Core Logic/transpositionTable";
import { engineRegistry } from "./engineRegistry.mjs";

self.onmessage = (e) => {
  const {
    bitboards,
    player,
    castlingRights,
    enPassantSquare,
    prevPositions,
    engine,
    maxDepth,
    timeLimit,
  } = e.data;

  clearTT();

  initializePieceIndicies(bitboards);
  initializePieceAtArray(bitboards);
  computeAllAttackMasks(bitboards);

  const engineFn = engineRegistry[engine];
  const move = engineFn(
    bitboards,
    player,
    castlingRights,
    enPassantSquare,
    prevPositions,
    maxDepth,
    timeLimit
  );

  postMessage({ move });
};
