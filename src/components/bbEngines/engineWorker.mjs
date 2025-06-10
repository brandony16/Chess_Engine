import { initializePieceAtArray } from "../bitboardUtils/pieceGetters";
import { initializePieceIndicies } from "../bitboardUtils/pieceIndicies";
import { computeAllAttackMasks } from "../bitboardUtils/PieceMasks/individualAttackMasks";
import { clearTT } from "../bitboardUtils/TranspositionTable/transpositionTable";
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