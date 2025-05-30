import { initializePieceAtArray } from "../bitboardUtils/pieceGetters";
import { initializePieceIndicies } from "../bitboardUtils/pieceIndicies";
import { computeAllAttackMasks } from "../bitboardUtils/PieceMasks/individualAttackMasks";
import { clearTT } from "../bitboardUtils/TranspositionTable/transpositionTable";
import { BMV5 } from "./BMV5/BondMonkeyV5";

onmessage = (e) => {
  const {
    bitboards,
    player,
    castlingRights,
    enPassantSquare,
    prevPositions,
    maxDepth,
    timeLimit,
  } = e.data;

  clearTT();

  initializePieceIndicies(bitboards);
  initializePieceAtArray(bitboards);
  computeAllAttackMasks(bitboards);

  const move = BMV5(
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
