import { initializePieceAtArray } from "../bitboardUtils/pieceGetters";
import { clearTT } from "../bitboardUtils/TranspositionTable/transpositionTable";
import { BMV4 } from "./BMV4/BondMonkeyV4";

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
  initializePieceAtArray(bitboards);

  const move = BMV4(
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
