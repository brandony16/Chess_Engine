import { initializePieceAtArray } from "../../coreLogic/pieceGetters";
import { initializePieceIndicies } from "../../coreLogic/pieceIndicies";
import { computeAllAttackMasks } from "../../coreLogic/PieceMasks/individualAttackMasks";
import { clearTT } from "../../coreLogic/transpositionTable";
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
